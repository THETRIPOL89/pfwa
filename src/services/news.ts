/**
 * News service. Fetches Italian financial news via the NewsData.io REST API
 * directly from the browser, then upserts results into the Supabase
 * `news_cache` table so subsequent loads are instant.
 *
 * Why no Edge Function? Supabase Edge Runtime blocks egress to almost
 * every external host. Browser fetches have no such restriction.
 */
import { supabase } from '@/lib/supabase';
import { USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { NewsArticle } from '@/types/domain';

const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY as string | undefined;
const NEWSDATA_BASE = 'https://newsdata.io/api/1/news';

interface NewsDataResponse {
  status: string;
  totalResults?: number;
  results?: {
    article_id: string;
    title: string;
    link: string;
    pubDate: string;
    source_id?: string;
    description?: string;
    content?: string;
    category?: string[];
    keywords?: string[];
  }[];
  message?: string;
}

interface FeedSpec {
  query: string;
  category: NonNullable<NewsArticle['category']>;
}

const FEEDS: FeedSpec[] = [
  { query: 'mercati azionari Italia', category: 'mercati' },
  { query: 'criptovalute bitcoin', category: 'crypto' },
  { query: 'economia Italia', category: 'economia' },
  { query: 'aziende italiane Piazza Affari', category: 'aziende' },
  { query: 'finanza personale risparmio', category: 'personale' },
];

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchNewsData(spec: FeedSpec): Promise<NewsArticle[]> {
  if (!NEWSDATA_API_KEY) throw new Error('VITE_NEWSDATA_API_KEY not set');
  const url = `${NEWSDATA_BASE}?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(spec.query)}&language=it&category=business,top&size=10`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`NewsData returned ${resp.status}`);
  const json = (await resp.json()) as NewsDataResponse;
  if (json.status !== 'success' || !json.results) return [];
  return json.results.map((it) => ({
    id: it.article_id,
    title: stripHtml(it.title).slice(0, 200),
    source: it.source_id ?? 'NewsData',
    url: it.link,
    publishedAt: new Date(it.pubDate).toISOString(),
    summary: stripHtml(it.description ?? it.content ?? '').slice(0, 240),
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
    refreshInBackground().catch((e) => console.error('news background refresh failed', e));
    if (opts?.category) {
      return cached.filter((n) => n.category === opts.category);
    }
    return cached;
  }

  // Cold start: fetch live synchronously so the page renders immediately.
  const feeds = opts?.category ? FEEDS.filter((f) => f.category === opts.category) : FEEDS;
  const results = await Promise.all(feeds.map(fetchNewsData));
  const articles = results.flat();
  const seen = new Set<string>();
  const deduped = articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
  deduped.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  persistToCache(deduped).catch((e) => console.error('news initial persist failed', e));
  return opts?.category ? deduped.filter((a) => a.category === opts.category) : deduped;
}

let backgroundRefreshInFlight = false;
async function refreshInBackground(): Promise<void> {
  if (backgroundRefreshInFlight) return;
  backgroundRefreshInFlight = true;
  try {
    const results = await Promise.all(FEEDS.map(fetchNewsData));
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