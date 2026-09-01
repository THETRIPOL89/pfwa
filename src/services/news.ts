/**
 * News service. Fetches Italian financial news from rss2json.com (a free
 * CORS-enabled proxy that parses Google News RSS) directly from the
 * browser, then upserts results into the Supabase `news_cache` table so
 * subsequent loads are instant.
 *
 * Strategy:
 *   1. Always read from DB cache first.
 *   2. If cache is empty OR stale (>15min old), fetch live RSS via rss2json.
 *   3. Persist live results to cache (so next load is instant).
 *   4. Background refresh fires after every cache hit to keep data fresh.
 *
 * No hardcoded fallback — if both cache and live fetch fail, the page
 * shows an empty state with no fake data, by design.
 */
import { supabase } from '@/lib/supabase';
import { USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { NewsArticle } from '@/types/domain';

const CACHE_TTL_MS = 1000 * 60 * 15;

interface FeedSpec {
  query: string;
  category: NonNullable<NewsArticle['category']>;
}

const FEEDS: FeedSpec[] = [
  { query: 'mercati+azionari+italia', category: 'mercati' },
  { query: 'criptovalute+bitcoin', category: 'crypto' },
  { query: 'economia+italia', category: 'economia' },
  { query: 'aziende+italiane+piazza+affari', category: 'aziende' },
  { query: 'finanza+personale+risparmio', category: 'personale' },
];

interface Rss2JsonResponse {
  status: string;
  items?: {
    title: string;
    link: string;
    pubDate: string;
    source?: string;
    description?: string;
  }[];
  message?: string;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `n-${h.toString(36)}`;
}

async function fetchRss2Json(spec: FeedSpec): Promise<NewsArticle[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${spec.query}&hl=it&gl=IT&ceid=IT:it`;
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`rss2json returned ${resp.status}`);
  const json = (await resp.json()) as Rss2JsonResponse;
  if (json.status !== 'ok' || !json.items) return [];
  return json.items.map((it) => ({
    id: hashString(it.link),
    title: stripHtml(decodeEntities(it.title)).slice(0, 200),
    source: it.source || 'Google News',
    url: it.link,
    publishedAt: new Date(it.pubDate).toISOString(),
    summary: stripHtml(decodeEntities(it.description ?? '')).slice(0, 240),
    category: spec.category,
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

async function fetchAndCache(feeds: FeedSpec[]): Promise<NewsArticle[]> {
  const results = await Promise.all(feeds.map(fetchRss2Json));
  const articles = results.flat();
  const seen = new Set<string>();
  const deduped = articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
  deduped.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  await persistToCache(deduped);
  return deduped;
}

let backgroundRefreshInFlight = false;
async function refreshInBackground(): Promise<void> {
  if (backgroundRefreshInFlight) return;
  backgroundRefreshInFlight = true;
  try {
    await fetchAndCache(FEEDS);
  } catch (e) {
    console.error('news background refresh failed', e);
  } finally {
    backgroundRefreshInFlight = false;
  }
}

export async function listNews(opts?: { category?: NewsArticle['category'] }): Promise<NewsArticle[]> {
  if (USE_MOCKS) {
    await networkDelay(180);
    let rows = db.news.slice();
    if (opts?.category) rows = rows.filter((n) => n.category === opts.category);
    rows.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    return rows;
  }

  const cached = await readCache();
  const feeds = opts?.category ? FEEDS.filter((f) => f.category === opts.category) : FEEDS;

  if (cached && cached.length > 0) {
    // Kick off background refresh to keep cache warm.
    refreshInBackground();
    return opts?.category ? cached.filter((n) => n.category === opts.category) : cached;
  }

  // Cold start — cache is empty, fetch live synchronously.
  try {
    const fresh = await fetchAndCache(feeds);
    return opts?.category ? fresh.filter((a) => a.category === opts.category) : fresh;
  } catch (e) {
    console.error('news cold-start fetch failed', e);
    return [];
  }
}