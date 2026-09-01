/**
 * Live quote lookup used by the InvestmentFormDialog to auto-fill the
 * average cost when the user types a symbol. Stooq.com for stocks/ETFs/
 * bonds (CORS-friendly CSV, no API key); CoinGecko for crypto.
 */
import type { AssetClass, Currency } from '@/types/domain';

export interface LiveQuote {
  priceCents: number;
  currency: Currency;
  source: string;
}

function parseCsvLine(line: string): string[] {
  // Stooq CSV is comma-separated, no quoted fields in practice.
  return line.split(',').map((c) => c.trim());
}

export function guessStooqSymbol(raw: string, assetClass: AssetClass): string {
  const sym = raw.trim().toLowerCase();
  // If user already included a market suffix, keep it as-is.
  if (sym.includes('.')) return sym;
  // Italian stocks trade on .MI by convention.
  return `${sym}.us`;
}

async function fetchStooq(symbol: string): Promise<LiveQuote> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Stooq returned ${resp.status}`);
  const csv = await resp.text();
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('Stooq: empty response');
  const header = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const row = parseCsvLine(lines[1]);
  const closeIdx = header.indexOf('close');
  if (closeIdx === -1) throw new Error('Stooq: no Close column');
  const closeStr = row[closeIdx];
  const close = Number(closeStr);
  if (!close || isNaN(close) || close <= 0) {
    throw new Error(`Stooq: invalid price for ${symbol}`);
  }
  // Stooq prices are quoted in the local currency of the listing (USD for
  // .us suffix, EUR for .mi, etc.). Heuristic: USD if the symbol has a .us
  // suffix, otherwise EUR. Users can override via the currency dropdown.
  const currency: Currency = symbol.endsWith('.us') ? 'USD' : 'EUR';
  return {
    priceCents: Math.round(close * 100),
    currency,
    source: 'Stooq',
  };
}

async function fetchCoinGecko(symbol: string): Promise<LiveQuote> {
  // Map common tickers to CoinGecko IDs. CoinGecko's /coins/markets endpoint
  // expects `vs_currency=eur` and a coin id, not a ticker symbol. For known
  // tickers we translate; otherwise fall back to a /search by symbol.
  const idMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    ADA: 'cardano',
    XRP: 'ripple',
    DOT: 'polkadot',
    DOGE: 'dogecoin',
    BNB: 'binancecoin',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
  };
  const id = idMap[symbol.toUpperCase()] ?? symbol.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=eur`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`CoinGecko returned ${resp.status}`);
  const json = (await resp.json()) as Record<string, { eur?: number }>;
  const entry = json[id];
  if (!entry || entry.eur == null) {
    throw new Error(`CoinGecko: no price for ${symbol}`);
  }
  return {
    priceCents: Math.round(entry.eur * 100),
    currency: 'EUR',
    source: 'CoinGecko',
  };
}

export async function fetchLiveQuote(
  rawSymbol: string,
  assetClass: AssetClass,
): Promise<LiveQuote> {
  const symbol = rawSymbol.trim();
  if (!symbol) throw new Error('Symbol vuoto');
  if (assetClass === 'crypto') {
    return fetchCoinGecko(symbol);
  }
  return fetchStooq(guessStooqSymbol(symbol, assetClass));
}