// Supabase Edge Function: news-feed
// Aggregates Google News RSS feeds for finance-related queries, normalizes
// each article, deduplicates by URL, and returns a flat list. Cached 15
// minutes in the `public.news_cache` table so Vercel rewrites get a fast,
// reliable response even if Google News blocks the runtime IP.
//
// Local run: supabase functions serve news-feed
// Deploy:    supabase functions deploy news-feed --no-verify-jwt

import {
  corsHeaders,
  errorResponse,
  handleCors,
  json,
} from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CACHE_TTL_MS = 1000 * 60 * 15;

const QUERIES: Record<string, string> = {
  mercati: 'mercati+azionari+italia',
  crypto: 'criptovalute+bitcoin',
  economia: 'economia+italia',
  aziende: 'aziende+italiane+piazza+affari',
  personale: 'finanza+personale+risparmio',
};

interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  description?: string;
}

async function fetchRss(query: string): Promise<RawArticle[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 PFWA/1.0' } });
  if (!resp.ok) throw new Error(`Google News returned ${resp.status}`);
  const xml = await resp.text();
  const items: RawArticle[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const fields = {
    title: /<title>([\s\S]*?)<\/title>/,
    link: /<link>([\s\S]*?)<\/link>/,
    pubDate: /<pubDate>([\s\S]*?)<\/pubDate>/,
    source: /<source[^>]*>([\s\S]*?)<\/source>/,
    description: /<description>([\s\S]*?)<\/description>/,
  };
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const pick = (re: RegExp) => {
      const r = block.match(re);
      return r ? r[1].trim() : '';
    };
    items.push({
      title: pick(fields.title).replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
      link: pick(fields.link),
      pubDate: pick(fields.pubDate),
      source: pick(fields.source),
      description: pick(fields.description),
    });
  }
  return items;
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `n-${h.toString(36)}`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim();
}

interface NewsRow {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary: string | null;
  category: string | null;
  fetched_at: string;
}

function rowToArticle(r: NewsRow) {
  return {
    id: r.id,
    title: r.title,
    source: r.source,
    url: r.url,
    publishedAt: r.published_at,
    summary: r.summary ?? undefined,
    category: r.category ?? undefined,
  };
}

async function readCache(category: string): Promise<NewsRow[] | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const filter = category === 'all' ? '' : `&category=eq.${encodeURIComponent(category)}`;
  const url = `${SUPABASE_URL}/rest/v1/news_cache?select=*&order=published_at.desc&limit=30${filter}`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!resp.ok) return null;
  return (await resp.json()) as NewsRow[];
}

async function writeCache(category: string, articles: NewsRow[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || articles.length === 0) return;
  if (category !== 'all') {
    articles = articles.map((a) => ({ ...a, category }));
  }
  await fetch(`${SUPABASE_URL}/rest/v1/news_cache?on_conflict=url`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(articles),
  });
}

function freshEnough(rows: NewsRow[]): boolean {
  if (rows.length === 0) return false;
  const newest = rows.reduce((acc, r) =>
    new Date(r.fetched_at).getTime() > new Date(acc.fetched_at).getTime() ? r : acc,
  );
  return Date.now() - new Date(newest.fetched_at).getTime() < CACHE_TTL_MS;
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? 'all';

    // 1. Cache hit — fast path.
    const cached = await readCache(category);
    if (cached && freshEnough(cached)) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'HIT' },
      });
    }

    // 2. Try to refresh from Google News.
    const queriesToFetch =
      category === 'all' || !QUERIES[category]
        ? Object.values(QUERIES)
        : [QUERIES[category]];

    let freshRows: NewsRow[] = [];
    try {
      const all = (await Promise.all(queriesToFetch.map(fetchRss))).flat();
      const seen = new Set<string>();
      freshRows = all
        .map((a) => ({
          id: hashString(a.link),
          title: a.title,
          source: a.source || 'Google News',
          url: a.link,
          published_at: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
          summary: stripHtml(a.description ?? '').slice(0, 240),
          category,
          fetched_at: new Date().toISOString(),
        }))
        .filter((a) => {
          if (!a.url || !a.title) return false;
          if (seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        })
        .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
        .slice(0, 30);

      if (freshRows.length > 0) {
        // Fire-and-forget: don't block the response on cache write.
        writeCache(category, freshRows).catch((e) =>
          console.error('news-feed cache write failed', e),
        );
      }
    } catch (fetchErr) {
      console.error('news-feed google fetch failed', fetchErr);
    }

    // 3. Serve what we have: fresh, stale cache, or empty.
    const rows = freshRows.length > 0 ? freshRows : cached ?? [];
    return json(rows.map(rowToArticle), {
      headers: {
        ...corsHeaders,
        'x-cache': freshRows.length > 0 ? 'MISS' : cached ? 'STALE' : 'EMPTY',
      },
    });
  } catch (err) {
    console.error('news-feed error', err);
    return errorResponse('Internal error', 500);
  }
});