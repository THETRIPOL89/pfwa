// Supabase Edge Function: crypto-quote
// Pass-through to CoinGecko's free simple-price endpoint. CORS-friendly, no
// key required. Cache 5 minutes.
//
// Local run: supabase functions serve crypto-quote
// Deploy:    supabase functions deploy crypto-quote

import { corsHeaders, errorResponse, handleCors, json, TTLCache } from '../_shared/cors.ts';

const cache = new TTLCache<unknown>(1000 * 60 * 5);

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean);
    const vs = url.searchParams.get('vs') ?? 'eur';
    if (ids.length === 0) return errorResponse('ids query param is required');

    const cacheKey = `${ids.join(',')}__${vs}`;
    const cached = cache.get(cacheKey);
    if (cached) return json(cached, { headers: { ...corsHeaders, 'x-cache': 'HIT' } });

    const upstream = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(','),
    )}&vs_currencies=${encodeURIComponent(vs)}&include_24hr_change=true`;
    const resp = await fetch(upstream, { headers: { Accept: 'application/json' } });

    if (!resp.ok) {
      return errorResponse(`CoinGecko upstream returned ${resp.status}`, 502);
    }

    const raw = (await resp.json()) as Record<string, Record<string, number>>;
    const now = Date.now();
    const quotes = Object.entries(raw).map(([id, entry]) => ({
      symbol: id.toUpperCase(),
      priceCents: Math.round((entry[vs] ?? 0) * 100),
      currency: vs.toUpperCase(),
      change24hPct: Number(((entry[`${vs}_24h_change`] ?? 0)).toFixed(2)),
      asOf: now,
    }));

    cache.set(cacheKey, quotes);
    return json(quotes, { headers: { ...corsHeaders, 'x-cache': 'MISS' } });
  } catch (err) {
    console.error('crypto-quote error', err);
    return errorResponse('Internal error', 500);
  }
});