// Supabase Edge Function: market-quote
// Proxies Yahoo Finance quote API. Avoids CORS and centralizes the key-less
// Yahoo endpoint behind our gateway. Cache 5 minutes.
//
// Local run: supabase functions serve market-quote
// Deploy:    supabase functions deploy market-quote

import { corsHeaders, errorResponse, handleCors, json, TTLCache } from '../_shared/cors.ts';

const cache = new TTLCache<unknown>(1000 * 60 * 5);

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  currency: string;
  regularMarketChangePercent: number;
  regularMarketTime: number;
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const symbols = (url.searchParams.get('symbols') ?? '').split(',').filter(Boolean);
    if (symbols.length === 0) return errorResponse('symbols query param is required');

    const cacheKey = symbols.join(',');
    const cached = cache.get(cacheKey);
    if (cached) return json(cached, { headers: { ...corsHeaders, 'x-cache': 'HIT' } });

    const upstream = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const resp = await fetch(upstream, {
      headers: {
        // Yahoo rejects requests without a UA.
        'User-Agent': 'Mozilla/5.0 PFWA/1.0',
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      return errorResponse(`Yahoo upstream returned ${resp.status}`, 502);
    }

    const raw = (await resp.json()) as { quoteResponse?: { result?: YahooQuote[] } };
    const quotes = (raw.quoteResponse?.result ?? []).map((q) => ({
      symbol: q.symbol,
      priceCents: Math.round(q.regularMarketPrice * 100),
      currency: q.currency ?? 'USD',
      change24hPct: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
      asOf: q.regularMarketTime ? q.regularMarketTime * 1000 : Date.now(),
    }));

    cache.set(cacheKey, quotes);
    return json(quotes, { headers: { ...corsHeaders, 'x-cache': 'MISS' } });
  } catch (err) {
    console.error('market-quote error', err);
    return errorResponse('Internal error', 500);
  }
});