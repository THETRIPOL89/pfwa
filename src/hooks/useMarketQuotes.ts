import { useQueries } from '@tanstack/react-query';
import type { MarketQuote } from '@/types/domain';
import { getMarketQuotes } from '@/services/market';
import { getCryptoQuotes } from '@/services/crypto';
import { useInvestments } from './useInvestments';

/**
 * Fetches live market quotes for every holding in the user's portfolio.
 * Splits between stock/ETF/bond quotes (Yahoo via Edge) and crypto
 * (CoinGecko via Edge). Returns an empty array while investments load.
 */
export function useMarketQuotes() {
  const investments = useInvestments();

  const stockSymbols =
    investments.data
      ?.filter((i) => i.assetClass !== 'crypto')
      .map((i) => i.symbol) ?? [];

  const cryptoSymbols =
    investments.data
      ?.filter((i) => i.assetClass === 'crypto')
      .map((i) => i.symbol.toLowerCase()) ?? [];

  const queries = useQueries({
    queries: [
      {
        queryKey: ['market', stockSymbols],
        queryFn: () => getMarketQuotes(stockSymbols),
        enabled: stockSymbols.length > 0,
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ['crypto', cryptoSymbols],
        queryFn: () => getCryptoQuotes(cryptoSymbols, 'eur'),
        enabled: cryptoSymbols.length > 0,
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const isLoading = investments.isLoading || queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const data: MarketQuote[] = queries.flatMap((q) => q.data ?? []);

  return { data, isLoading, isError };
}