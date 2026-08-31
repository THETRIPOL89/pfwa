import { MOCK_ACCOUNTS } from '@/mocks/accounts';
import { MOCK_TRANSACTIONS } from '@/mocks/transactions';
import { MOCK_BUDGETS } from '@/mocks/budgets';
import { MOCK_INVESTMENTS, MOCK_DIVIDENDS } from '@/mocks/investments';
import { MOCK_NEWS } from '@/mocks/news';
import { MOCK_INSIGHTS } from '@/mocks/insights';
import { DEFAULT_CATEGORIES } from '@/mocks/categories';
import type {
  Account,
  Transaction,
  Budget,
  Investment,
  Dividend,
  NewsArticle,
  Insight,
  Category,
} from '@/types/domain';
import { uid } from '@/lib/utils';

/**
 * In-memory "database" backing the mock service layer. State lives here
 * so mutations (create/update/delete) are observable by the rest of the
 * app via React Query invalidation.
 *
 * When `VITE_USE_MOCKS=false`, the same service modules will swap in
 * real Supabase calls behind the same exported signatures.
 */

class MockDB {
  accounts: Account[] = structuredClone(MOCK_ACCOUNTS);
  transactions: Transaction[] = structuredClone(MOCK_TRANSACTIONS);
  budgets: Budget[] = structuredClone(MOCK_BUDGETS);
  investments: Investment[] = structuredClone(MOCK_INVESTMENTS);
  dividends: Dividend[] = structuredClone(MOCK_DIVIDENDS);
  news: NewsArticle[] = structuredClone(MOCK_NEWS);
  insights: Insight[] = structuredClone(MOCK_INSIGHTS);
  categories: Category[] = structuredClone(DEFAULT_CATEGORIES);

  nextId(prefix: string): string {
    return `${prefix}-${uid()}`;
  }
}

export const db = new MockDB();

/** Simulated network latency for mock fetches — keeps loading states realistic. */
export function networkDelay(ms = 250) {
  return new Promise<void>((res) => setTimeout(res, ms));
}