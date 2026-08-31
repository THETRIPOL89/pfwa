import { API_BASE_URL, USE_MOCKS } from '@/lib/supabase';
import type { MarketQuote } from '@/types/domain';
import { db, networkDelay } from './_db';

const SEED_PRICES_CENTS: Record<string, number> = {
  'VWRL.MI': 11_220_00,
  AAPL: 21_580_00,
  'ENI.MI': 1_488_00,
  TIT: 9_980_00,
};

export async function getMarketQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (USE_MOCKS) {
    await networkDelay(300);
    const now = Date.now();
    return symbols.map((symbol) => {
      const basePrice = SEED_PRICES_CENTS[symbol] ?? 10_000_00;
      const seed = Array.from(symbol).reduce((a, c) => a + c.charCodeAt(0), 0);
      const jitter = ((now / 60000) % 7) / 100;
      const price = Math.round(basePrice * (1 + jitter - 0.03));
      const change = ((jitter - 0.03) * 100) / 6;
      return {
        symbol,
        priceCents: price,
        currency: symbol === 'AAPL' ? 'USD' : 'EUR',
        change24hPct: Number(change.toFixed(2)),
        asOf: now,
      };
    });
  }
  if (symbols.length === 0) return [];
  const url = `${API_BASE_URL}/market-quote?symbols=${encodeURIComponent(symbols.join(','))}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Market quote failed: ${resp.status}`);
  const raw = (await resp.json()) as MarketQuote[];
  return raw;
}