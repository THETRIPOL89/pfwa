import { API_BASE_URL, USE_MOCKS } from '@/lib/supabase';
import { networkDelay } from './_db';
import type { MarketQuote } from '@/types/domain';

const SEED: Record<string, { price: number; change: number }> = {
  bitcoin: { price: 64_200_00_00, change: 1.8 },
  ethereum: { price: 3_180_00_00, change: 2.4 },
};

export async function getCryptoQuotes(
  ids: string[],
  vs = 'eur',
): Promise<MarketQuote[]> {
  if (USE_MOCKS) {
    await networkDelay(280);
    const now = Date.now();
    return ids.map((id) => {
      const seed = SEED[id] ?? { price: 100_00, change: 0 };
      return {
        symbol: id.toUpperCase(),
        priceCents: seed.price,
        currency: vs.toUpperCase() as MarketQuote['currency'],
        change24hPct: seed.change,
        asOf: now,
      };
    });
  }
  if (ids.length === 0) return [];
  const url = `${API_BASE_URL}/crypto-quote?ids=${encodeURIComponent(ids.join(','))}&vs=${vs}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Crypto quote failed: ${resp.status}`);
  return (await resp.json()) as MarketQuote[];
}