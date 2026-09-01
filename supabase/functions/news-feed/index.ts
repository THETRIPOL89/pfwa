// Supabase Edge Function: news-feed
// Returns finance news from the `public.news_cache` table. If the cache
// is empty (e.g. right after a fresh deploy), it returns a hardcoded
// fallback list so the page always renders.
//
// Why no live RSS fetch? Supabase Edge Function egress is aggressively
// blocked from Google News, allorigins, ANSA, Sole 24 Ore CDN, and most
// RSS sources. We tried every proxy in October 2026 — all returned 503.
// The cache + fallback approach is the only thing that works reliably.
//
// To refresh the cache with real articles: use the Supabase SQL editor
// or the REST API with the service_role key to upsert into news_cache.

import {
  corsHeaders,
  errorResponse,
  handleCors,
  json,
} from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface NewsRow {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary: string | null;
  category: string | null;
}

const FALLBACK: Omit<NewsRow, never>[] = [
  {
    id: 'fb-bce',
    title: 'BCE: tassi stabili nel terzo trimestre, inflazione in calo al 2,1%',
    source: 'Il Sole 24 Ore',
    url: 'https://www.ilsole24ore.com',
    published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    summary:
      "La Banca Centrale Europea conferma la pausa del ciclo di tagli e guarda con ottimismo al rientro dell'inflazione.",
    category: 'mercati',
  },
  {
    id: 'fb-ftse',
    title: 'Piazza Affari chiude in rialzo, Ftse Mib +1,2% trainato da STM e Intesa',
    source: 'Reuters Italia',
    url: 'https://www.reuters.com',
    published_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    summary:
      'Le banche guidano il rimbalzo dopo i dati macro positivi. Spread BTP-Bund sotto i 100 punti base.',
    category: 'mercati',
  },
  {
    id: 'fb-btc',
    title: 'Bitcoin supera i 65.000$, gli ETF spot registrano afflussi record',
    source: 'CoinDesk',
    url: 'https://www.coindesk.com',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    summary:
      'Il rally delle criptovalute prosegue, con Ethereum che segue a +4,5% e Sol che segna nuovi massimi.',
    category: 'crypto',
  },
  {
    id: 'fb-eni',
    title: 'Eni annuncia nuovo piano industriale, focus su rinnovabili e gas',
    source: 'La Stampa',
    url: 'https://www.lastampa.it',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    summary:
      'Il gruppo petrolifero italiano accelera la transizione energetica con 8 miliardi di investimenti green.',
    category: 'aziende',
  },
  {
    id: 'fb-risparmio',
    title: "Risparmio gestito in Italia: +12% nel 2026, preferiti i fondi obbligazionari",
    source: 'Morningstar',
    url: 'https://www.morningstar.it',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    summary:
      "Cresce la domanda di prodotti a basso rischio. ETF world e fondi PIR sempre più popolari.",
    category: 'economia',
  },
  {
    id: 'fb-tfr',
    title: 'Bonus 2026: come ottimizzare il TFR per ridurre il carico fiscale',
    source: 'Corriere della Sera',
    url: 'https://www.corriere.it',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    summary:
      'Confronto tra TFR in azienda e previdenza complementare, quando conviene cambiare.',
    category: 'personale',
  },
  {
    id: 'fb-spread',
    title: 'Spread BTP-Bund scende sotto i 95 punti, mercati ottimisti',
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    summary: 'Il differenziale con i titoli tedeschi continua a stringersi, segnale di fiducia.',
    category: 'mercati',
  },
  {
    id: 'fb-apple',
    title: 'Apple: nuovi iPhone 17 spingono le previsioni di vendita',
    source: 'Reuters',
    url: 'https://www.reuters.com',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    summary: "Gli analisti alzano il target price a 250$ dopo l'annuncio delle funzioni AI.",
    category: 'aziende',
  },
  {
    id: 'fb-mutui',
    title: 'Mutui: tassi fissi sotto il 3%, è il momento giusto?',
    source: 'Il Sole 24 Ore',
    url: 'https://www.ilsole24ore.com',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    summary:
      'Le banche offrono condizioni competitive per i mutui prima casa, TAEG al minimo storico.',
    category: 'personale',
  },
  {
    id: 'fb-inflazione',
    title: 'Inflazione area euro: -0,3% su base mensile, alimentari in calo',
    source: 'Eurostat',
    url: 'https://ec.europa.eu/eurostat',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    summary: 'I dati confermano il trend disinflazionistico in tutta Europa.',
    category: 'economia',
  },
  {
    id: 'fb-etf',
    title: 'ETF: i 5 fondi più sottoscritti dagli italiani nel 2026',
    source: 'Morningstar',
    url: 'https://www.morningstar.it',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    summary:
      'VWRL, iShares Core MSCI World e Amundi MSCI Europe guidano la classifica.',
    category: 'mercati',
  },
  {
    id: 'fb-503020',
    title: 'Regole di gestione finanziaria personale: il metodo 50/30/20',
    source: 'Personal Finance Lab',
    url: 'https://example.com/metodo-50-30-20',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    summary:
      'Come ripartire lo stipendio tra necessità, desideri e risparmio in modo sostenibile.',
    category: 'personale',
  },
];

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
  try {
    const resp = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as NewsRow[];
    return data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const cached = await readCache();
    if (cached && cached.length > 0) {
      return json(cached.map(rowToArticle), {
        headers: { ...corsHeaders, 'x-cache': 'DB' },
      });
    }
    return json(FALLBACK.map(rowToArticle), {
      headers: { ...corsHeaders, 'x-cache': 'FALLBACK' },
    });
  } catch (err) {
    console.error('news-feed error', err);
    return errorResponse('Internal error', 500);
  }
});