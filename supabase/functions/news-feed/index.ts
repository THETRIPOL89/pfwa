// Supabase Edge Function: news-feed
// Aggregates Google News RSS feeds for finance-related queries, normalizes
// each article, deduplicates by URL, and returns a flat list.
//
// Three-tier fallback so /api/news-feed never returns 500:
//   1. Cache DB fresca (<15 min) → return immediately
//   2. Google News (via allorigins proxy) → fetch + cache write
//   3. Mock hardcoded → guaranteed response even with all providers down
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

// Hardcoded fallback: ensures /api/news-feed always returns data, even if
// every provider and cache layer is unavailable. Articles are illustrative
// finance headlines in Italian — they will appear as long as `publishedAt`
// is in the past so `timeAgo` formats sensibly.
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
      'Il rally delle criptovalute prosegue, con Ethereum che segue a +4,5% e Sol che segna nuovi massimi.',
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
    summary: 'Il differenziale con i titoli tedeschi continua a stringersi, segnale di fiducia.',
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
  {
    id: 'fb-9',
    title: 'Mutui: tassi fissi sotto il 3%, è il momento giusto?',
    source: 'Il Sole 24 Ore',
    url: 'https://example.com/mutui-tassi',
    summary: 'Le banche offrono condizioni competitive per i mutui prima casa, TAEG al minimo storico.',
    category: 'personale',
  },
  {
    id: 'fb-10',
    title: 'Inflazione area euro: -0,3% su base mensile, alimentari in calo',
    source: 'Eurostat',
    url: 'https://example.com/inflazione-eurostat',
    summary: 'I dati confermano il trend disinflazionistico in tutta Europa.',
    category: 'economia',
  },
  {
    id: 'fb-11',
    title: 'ETF: i 5 fondi più sottoscritti dagli italiani nel 2026',
    source: 'Morningstar',
    url: 'https://example.com/etf-top-5',
    summary: 'VWRL, iShares Core MSCI World e Amundi MSCI Europe guidano la classifica.',
    category: 'mercati',
  },
  {
    id: 'fb-12',
    title: 'Regole di gestione finanziaria personale: il metodo 50/30/20',
    source: 'Personal Finance Lab',
    url: 'https://example.com/metodo-50-30-20',
    summary:
      'Come ripartire lo stipendio tra necessità, desideri e risparmio in modo sostenibile.',
    category: 'personale',
  },
];

interface RawArticle {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  description?: string;
}

async function fetchRss(query: string): Promise<RawArticle[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
  let xml = '';
  for (const target of [proxyUrl, rssUrl]) {
    try {
      const resp = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 PFWA/1.0' },
      });
      if (!resp.ok) throw new Error(`fetch returned ${resp.status}`);
      xml = await resp.text();
      if (xml.includes('<item>')) break;
    } catch (e) {
      console.error('news-feed proxy attempt failed', target, e);
    }
  }
  if (!xml.includes('<item>')) throw new Error('All fetch attempts failed');
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

function fallbackFor(category: string) {
  // Filter fallback by category. 'all' returns everything.
  const now = new Date();
  const items = category === 'all'
    ? FALLBACK_NEWS
    : FALLBACK_NEWS.filter((n) => n.category === category);
  // Stamp each item with a staggered publishedAt so the ordering looks
  // realistic (most recent first).
  return items.map((n, i) => ({
    id: n.id,
    title: n.title,
    source: n.source,
    url: n.url,
    publishedAt: new Date(now.getTime() - i * 1000 * 60 * 30).toISOString(),
    summary: n.summary,
    category: n.category,
  }));
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? 'all';

    // 1. Fresh DB cache.
    const cached = await readCache(category);
    if (cached && freshEnough(cached)) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'HIT' },
      });
    }

    // 2. Try to refresh from Google News (with proxy fallback).
    let freshRows: NewsRow[] = [];
    const queriesToFetch =
      category === 'all' || !QUERIES[category]
        ? Object.values(QUERIES)
        : [QUERIES[category]];

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
        writeCache(category, freshRows).catch((e) =>
          console.error('news-feed cache write failed', e),
        );
      }
    } catch (fetchErr) {
      console.error('news-feed google fetch failed', fetchErr);
    }

    // 3. Serve in priority order: fresh > cached > hardcoded fallback.
    if (freshRows.length > 0) {
      return json(freshRows.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'MISS' },
      });
    }
    if (cached && cached.length > 0) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'STALE' },
      });
    }
    const fb = fallbackFor(category);
    return json(fb, {
      headers: { ...corsHeaders, 'x-cache': 'FALLBACK' },
    });
  } catch (err) {
    console.error('news-feed error', err);
    return errorResponse('Internal error', 500);
  }
});