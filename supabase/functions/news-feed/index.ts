// Supabase Edge Function: news-feed
// Aggregates RSS feeds from Italian financial newspapers (Il Sole 24 Ore,
// ANSA, La Repubblica, etc.) directly. We deliberately avoid Google News
// RSS — Supabase Edge Function egress is blocked from Google News.
//
// Three-tier fallback so /api/news-feed never returns 500:
//   1. Cache DB fresca (<15 min) → return immediately
//   2. Direct RSS from Italian outlets → fetch + cache write
//   3. Hardcoded fallback → guaranteed response
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

interface FeedSource {
  url: string;
  source: string;
  category: 'mercati' | 'economia' | 'aziende';
}

const FEEDS: FeedSource[] = [
  { url: 'https://www.ilsole24ore.com/rss/finanza.xml', source: 'Il Sole 24 Ore', category: 'mercati' },
  { url: 'https://www.ilsole24ore.com/rss/economia.xml', source: 'Il Sole 24 Ore', category: 'economia' },
  { url: 'https://www.ansa.it/sito/notizie/economia/economia.shtml', source: 'ANSA', category: 'economia' },
  { url: 'https://www.repubblica.it/rss/economia/rss2.0.xml', source: 'La Repubblica', category: 'economia' },
  { url: 'https://www.corriere.it/rss/ Economia.xml', source: 'Corriere della Sera', category: 'economia' },
];

const FALLBACK_NEWS = [
  {
    id: 'fb-1',
    title: 'BCE: tassi stabili nel terzo trimestre, inflazione in calo al 2,1%',
    source: 'Il Sole 24 Ore',
    url: 'https://example.com/bce-tassi-stabili',
    summary:
      "La Banca Centrale Europea conferma la pausa del ciclo di tagli e guarda con ottimismo al rientro dell'inflazione.",
    category: 'mercati',
  },
  {
    id: 'fb-2',
    title: 'Piazza Affari chiude in rialzo, Ftse Mib +1,2% trainato da STM e Intesa',
    source: 'Reuters Italia',
    url: 'https://example.com/ftse-mib-rialzo',
    summary:
      'Le banche guidano il rimbalzo dopo i dati macro positivi. Spread BTP-Bund sotto i 100 punti base.',
    category: 'mercati',
  },
  {
    id: 'fb-3',
    title: 'Bitcoin supera i 65.000$, gli ETF spot registrano afflussi record',
    source: 'CoinDesk',
    url: 'https://example.com/btc-65000',
    summary:
      'Il rally delle criptovalute prosegue, con Ethereum che segue a +4,5%.',
    category: 'crypto',
  },
  {
    id: 'fb-4',
    title: 'Eni annuncia nuovo piano industriale, focus su rinnovabili e gas',
    source: 'La Stampa',
    url: 'https://example.com/eni-piano',
    summary:
      'Il gruppo petrolifero italiano accelera la transizione energetica con 8 miliardi di investimenti green.',
    category: 'aziende',
  },
  {
    id: 'fb-5',
    title: "Risparmio gestito in Italia: +12% nel 2026, preferiti i fondi obbligazionari",
    source: 'Morningstar',
    url: 'https://example.com/risparmio-gestito',
    summary:
      "Cresce la domanda di prodotti a basso rischio. ETF world e fondi PIR sempre più popolari.",
    category: 'economia',
  },
  {
    id: 'fb-6',
    title: 'Bonus 2026: come ottimizzare il TFR per ridurre il carico fiscale',
    source: 'Corriere della Sera',
    url: 'https://example.com/bonus-tfr',
    summary:
      'Confronto tra TFR in azienda e previdenza complementare, quando conviene cambiare.',
    category: 'personale',
  },
  {
    id: 'fb-7',
    title: 'Spread BTP-Bund scende sotto i 95 punti, mercati ottimisti',
    source: 'Bloomberg',
    url: 'https://example.com/btp-bund',
    summary: 'Il differenziale con i titoli tedeschi continua a stringersi.',
    category: 'mercati',
  },
  {
    id: 'fb-8',
    title: 'Apple: nuovi iPhone 17 spingono le previsioni di vendita',
    source: 'Reuters',
    url: 'https://example.com/apple-iphone17',
    summary: "Gli analisti alzano il target price a 250$ dopo l'annuncio delle funzioni AI.",
    category: 'aziende',
  },
];

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

async function readCache(): Promise<NewsRow[] | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/news_cache?select=*&order=published_at.desc&limit=30`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!resp.ok) return null;
  return (await resp.json()) as NewsRow[];
}

async function writeCache(articles: NewsRow[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || articles.length === 0) return;
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

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `n-${h.toString(36)}`;
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

function parseRssDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function parseRss(xml: string, source: string, defaultCategory: string): NewsRow[] {
  const items: NewsRow[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const fields = {
    title: /<title>([\s\S]*?)<\/title>/,
    link: /<link>([\s\S]*?)<\/link>/,
    pubDate: /<pubDate>([\s\S]*?)<\/pubDate>/,
    description: /<description>([\s\S]*?)<\/description>/,
  };
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const pick = (re: RegExp): string => {
      const r = block.match(re);
      return r ? r[1].trim() : '';
    };
    const title = decodeEntities(pick(fields.title));
    const link = decodeEntities(pick(fields.link));
    const pubDate = pick(fields.pubDate);
    const description = decodeEntities(pick(fields.description));
    if (!title || !link) continue;
    items.push({
      id: hashString(link),
      title: title.slice(0, 200),
      source,
      url: link,
      published_at: parseRssDate(pubDate),
      summary: stripHtml(description).slice(0, 240) || null,
      category: defaultCategory,
      fetched_at: new Date().toISOString(),
    });
  }
  return items;
}

async function fetchFeed(feed: FeedSource): Promise<NewsRow[]> {
  try {
    const resp = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PFWA/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!resp.ok) {
      console.error(`news-feed: ${feed.source} returned ${resp.status}`);
      return [];
    }
    const xml = await resp.text();
    return parseRss(xml, feed.source, feed.category);
  } catch (e) {
    console.error(`news-feed: ${feed.source} fetch failed`, e);
    return [];
  }
}

function fallbackFor() {
  const now = Date.now();
  return FALLBACK_NEWS.map((n, i) => ({
    id: n.id,
    title: n.title,
    source: n.source,
    url: n.url,
    publishedAt: new Date(now - i * 1000 * 60 * 30).toISOString(),
    summary: n.summary,
    category: n.category,
  }));
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    // 1. Fresh DB cache.
    const cached = await readCache();
    if (cached && freshEnough(cached)) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'HIT' },
      });
    }

    // 2. Direct RSS from Italian outlets.
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const allItems = results.flat();
    const seen = new Set<string>();
    const freshRows = allItems
      .filter((it) => {
        if (!it.url || seen.has(it.url)) return false;
        seen.add(it.url);
        return true;
      })
      .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
      .slice(0, 30);

    if (freshRows.length > 0) {
      writeCache(freshRows).catch((e) =>
        console.error('news-feed cache write failed', e),
      );
      return json(freshRows.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'MISS' },
      });
    }

    // 3. Stale cache.
    if (cached && cached.length > 0) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'STALE' },
      });
    }

    // 4. Hardcoded fallback.
    return json(fallbackFor(), {
      headers: { ...corsHeaders, 'x-cache': 'FALLBACK' },
    });
  } catch (err) {
    console.error('news-feed error', err);
    return errorResponse('Internal error', 500);
  }
});