// Supabase Edge Function: news-feed
// Aggregates Google News RSS feeds for finance-related queries, normalizes
// each article, deduplicates by URL, and returns a flat list. Cached 15
// minutes.
//
// Local run: supabase functions serve news-feed
// Deploy:    supabase functions deploy news-feed

import { corsHeaders, errorResponse, handleCors, json, TTLCache } from '../_shared/cors.ts';

const cache = new TTLCache<unknown>(1000 * 60 * 15);

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
  // Use a simple regex parser (no extra dep needed for Google News RSS which is
  // flat). For richer parsing, swap in `fast-xml-parser` via import_map.
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

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? 'all';

    const cacheKey = category;
    const cached = cache.get(cacheKey);
    if (cached) return json(cached, { headers: { ...corsHeaders, 'x-cache': 'HIT' } });

    const queriesToFetch =
      category === 'all' || !QUERIES[category]
        ? Object.values(QUERIES)
        : [QUERIES[category]];

    const all = (await Promise.all(queriesToFetch.map(fetchRss))).flat();

    const seen = new Set<string>();
    const articles = all
      .map((a) => ({
        id: hashString(a.link),
        title: a.title,
        url: a.link,
        publishedAt: new Date(a.pubDate).toISOString(),
        source: a.source || 'Google News',
        summary: stripHtml(a.description ?? '').slice(0, 240),
        category: category === 'all' ? undefined : (category as 'mercati'),
      }))
      .filter((a) => {
        if (!a.url || !a.title) return false;
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
      })
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
      .slice(0, 30);

    cache.set(cacheKey, articles);
    return json(articles, { headers: { ...corsHeaders, 'x-cache': 'MISS' } });
  } catch (err) {
    console.error('news-feed error', err);
    return errorResponse('Internal error', 500);
  }
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim();
}
function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `n-${h.toString(36)}`;
}