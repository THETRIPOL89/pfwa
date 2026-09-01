/**
 * News service. Fetches Google News RSS via api.rss2json.com — a free
 * CORS-enabled proxy — directly from the browser, then upserts results
 * into the Supabase `news_cache` table so subsequent loads are instant.
 *
 * Why no Edge Function? Supabase Edge Runtime blocks egress to almost
 * every external host (Google, Sole24Ore CDN, RSS aggregators). Browser
 * fetches have no such restriction.
 */
import { supabase } from '@/lib/supabase';
import { USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { NewsArticle } from '@/types/domain';

const FEEDS: { id: string; url: string; category: string }[] = [
  {
    id: 'mercati',
    url: 'https://news.google.com/rss/search?q=mercati+azionari+italia&hl=it&gl=IT&ceid=IT:it',
    category: 'mercati',
  },
  {
    id: 'crypto',
    url: 'https://news.google.com/rss/search?q=criptovalute+bitcoin&hl=it&gl=IT&ceid=IT:it',
    category: 'crypto',
  },
  {
    id: 'economia',
    url: 'https://news.google.com/rss/search?q=economia+italia&hl=it&gl=IT&ceid=IT:it',
    category: 'economia',
  },
  {
    id: 'aziende',
    url: 'https://news.google.com/rss/search?q=aziende+italiane+piazza+affari&hl=it&gl=IT&ceid=IT:it',
    category: 'aziende',
  },
  {
    id: 'personale',
    url: 'https://news.google.com/rss/search?q=finanza+personale+risparmio&hl=it&gl=IT&ceid=IT:it',
    category: 'personale',
  },
];

interface Rss2JsonResponse {
  status: string;
  items?: {
    title: string;
    link: string;
    pubDate: string;
    source?: string;
    description?: string;
    enclosure?: { link?: string };
  }[];
  message?: string;
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `n-${h.toString(36)}`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchRss2Json(feed: typeof FEEDS[number]): Promise<NewsArticle[]> {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=20`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`rss2json returned ${resp.status}`);
  const json = (await resp.json()) as Rss2JsonResponse;
  if (json.status !== 'ok' || !json.items) return 0;
  return json.items.map((it) => ({
    id: hashString(it.link),
    title: stripHtml(it.title).slice(0, 200),
    source: it.source || 'Google News',
    url: it.link,
    publishedAt: new Date(it.pubDate).toISOString(),
    summary: stripHtml(it.description ?? '').slice(0, 240),
    category: feed.category as NewsArticle['category'],
  }));
}

async function persistToCache(articles: NewsArticle[]): Promise<void> {
  if (articles.length === 0) return;
  const rows = articles.map((a) => ({
    id: a.id,
    title: a.title,
    source: a.source,
    url: a.url,
    published_at: a.publishedAt,
    summary: a.summary ?? null,
    category: a.category ?? null,
  }));
  // Upsert by url so re-fetches overwrite stale entries.
  const { error } = await supabase
    .from('news_cache')
    .upsert(rows, { onConflict: 'url' });
  if (error) console.error('news cache upsert failed', error);
}

async function readCache(): Promise<NewsArticle[] | null> {
  const { data, error } = await supabase
    .from('news_cache')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) {
    console.error('news cache read failed', error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    url: r.url,
    publishedAt: r.published_at,
    summary: r.summary ?? undefined,
    category: (r.category as NewsArticle['category']) ?? undefined,
  }));
}

export async function listNews(opts?: { category?: NewsArticle['category'] }): Promise<NewsArticle[]> {
  if (USE_MOCKS) {
    await networkDelay(180);
    let rows = db.news.slice();
    if (opts?.category) rows = rows.filter((n) => n.category === opts.category);
    rows.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    return rows;
  }

  // Always read what's already in the DB cache first.
  const cached = await readCache();
  if (cached) {
    // Trigger a background refresh to keep the cache warm.
    refreshInBackground().catch((e) => console.error('news background refresh failed', e));
    if (opts?.category) {
      return cached.filter((n) => n.category === opts.category);
    }
    return cached;
  }

  // Cold start: fetch live RSS synchronously so the page renders immediately.
  const allFeeds = opts?.category ? FEEDS.filter((f) => f.category === opts.category) : FEEDS;
  const results = await Promise.all(allFeeds.map(fetchRss2Json));
  const articles = results.flat();
  // Deduplicate by URL.
  const seen = new Set<string>();
  const deduped = articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
  deduped.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  // Persist so next load is instant.
  persistToCache(deduped).catch((e) => console.error('news initial persist failed', e));
  return opts?.category ? deduped.filter((a) => a.category === opts.category) : deduped;
}

let backgroundRefreshInFlight = false;
async function refreshInBackground(): Promise<void> {
  if (backgroundRefreshInFlight) return;
  backgroundRefreshInFlight = true;
  try {
    const results = await Promise.all(FEEDS.map(fetchRss2Json));
    const articles = results.flat();
    const seen = new Set<string>();
    const deduped = articles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
    deduped.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    await persistToCache(deduped);
  } finally {
    backgroundRefreshInFlight = false;
  }
}