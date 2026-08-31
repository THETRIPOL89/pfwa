import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';

/**
 * Custom storage adapter so persisted query cache can live in IndexedDB
 * (survives a hard refresh, larger quota than localStorage). Used by
 * `persistQueryClient` if we ever wire that up — currently the offline
 * cache is held in memory per session.
 */

export const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const value = await get<string>(key);
    return value ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await del(key);
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 s — re-fetch in background
      gcTime: 1000 * 60 * 60 * 24, // 24 h cache retention
      retry: (failureCount, error) => {
        // Don't retry 4xx; back off for 5xx / network errors.
        if (error instanceof Error && /4\d\d/.test(error.message)) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 2,
    },
  },
});