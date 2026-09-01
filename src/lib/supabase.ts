/**
 * Typed Supabase client. Reads public env vars baked at build time.
 * If either URL or anon key is missing the client is created with a
 * dummy URL — `VITE_USE_MOCKS=true` callers will never hit the network.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key';

/**
 * Hand-written Database type mirroring `supabase/migrations/0001_init.sql`.
 * Each table requires `Relationships: []` for supabase-js v2.112+ typed
 * queries. Money is always `bigint` cents; Postgres returns strings via
 * PostgREST for `bigint`, so callers cast to `Number()` as needed.
 */

type EmptyRels = [];

type AccountTable = {
  Row: {
    id: string;
    user_id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'crypto_wallet' | 'investment';
    currency: string;
    opening_balance_cents: number;
    balance_cents: number;
    color: string;
    icon: string;
    institution: string | null;
    archived: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'crypto_wallet' | 'investment';
    currency?: string;
    opening_balance_cents?: number;
    balance_cents?: number;
    color?: string;
    icon?: string;
    institution?: string | null;
    archived?: boolean;
  };
  Update: Partial<AccountTable['Insert']>;
  Relationships: EmptyRels;
};

type CategoryTable = {
  Row: {
    id: string;
    user_id: string | null;
    parent_id: string | null;
    name: string;
    icon: string;
    color: string;
    kind: 'expense' | 'income' | 'both';
    is_default: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    parent_id?: string | null;
    name: string;
    icon?: string;
    color?: string;
    kind: 'expense' | 'income' | 'both';
    is_default?: boolean;
  };
  Update: Partial<CategoryTable['Insert']>;
  Relationships: EmptyRels;
};

type TransactionTable = {
  Row: {
    id: string;
    user_id: string;
    account_id: string;
    category_id: string | null;
    kind: 'expense' | 'income';
    amount_cents: number;
    currency: string;
    occurred_at: string;
    payee: string | null;
    notes: string | null;
    tags: string[];
    recurring_rule: unknown | null;
    recurring_parent_id: string | null;
    receipt_path: string | null;
    transfer_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    account_id: string;
    category_id?: string | null;
    kind: 'expense' | 'income';
    amount_cents: number;
    currency?: string;
    occurred_at: string;
    payee?: string | null;
    notes?: string | null;
    tags?: string[];
    recurring_rule?: unknown | null;
    recurring_parent_id?: string | null;
    receipt_path?: string | null;
    transfer_id?: string | null;
  };
  Update: Partial<TransactionTable['Insert']>;
  Relationships: EmptyRels;
};

type TransferTable = {
  Row: {
    id: string;
    user_id: string;
    from_account_id: string;
    to_account_id: string;
    amount_cents: number;
    currency: string;
    occurred_at: string;
    notes: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    from_account_id: string;
    to_account_id: string;
    amount_cents: number;
    currency?: string;
    occurred_at: string;
    notes?: string | null;
  };
  Update: Partial<TransferTable['Insert']>;
  Relationships: EmptyRels;
};

type BudgetTable = {
  Row: {
    id: string;
    user_id: string;
    category_id: string;
    period: 'weekly' | 'monthly' | 'yearly';
    amount_cents: number;
    starts_on: string;
    ends_on: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    category_id: string;
    period: 'weekly' | 'monthly' | 'yearly';
    amount_cents: number;
    starts_on: string;
    ends_on?: string | null;
  };
  Update: Partial<BudgetTable['Insert']>;
  Relationships: EmptyRels;
};

type InvestmentTable = {
  Row: {
    id: string;
    user_id: string;
    account_id: string;
    symbol: string;
    name: string;
    asset_class: 'stock' | 'etf' | 'bond' | 'crypto' | 'other';
    quantity: number;
    avg_cost_cents: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    account_id: string;
    symbol: string;
    name: string;
    asset_class: 'stock' | 'etf' | 'bond' | 'crypto' | 'other';
    quantity: number;
    avg_cost_cents: number;
    currency?: string;
  };
  Update: Partial<InvestmentTable['Insert']>;
  Relationships: EmptyRels;
};

type DividendTable = {
  Row: {
    id: string;
    user_id: string;
    investment_id: string;
    amount_cents: number;
    currency: string;
    received_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    investment_id: string;
    amount_cents: number;
    currency?: string;
    received_at: string;
  };
  Update: Partial<DividendTable['Insert']>;
  Relationships: EmptyRels;
};

type InsightTable = {
  Row: {
    id: string;
    user_id: string;
    kind: string;
    severity: string;
    title: string;
    body: string;
    icon_key: string;
    color_token: string;
    period_start: string;
    period_end: string;
    generated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    kind: string;
    severity: string;
    title: string;
    body: string;
    icon_key: string;
    color_token: string;
    period_start: string;
    period_end: string;
    generated_at?: string;
  };
  Update: Partial<InsightTable['Insert']>;
  Relationships: EmptyRels;
};

type NewsCacheTable = {
  Row: {
    id: string;
    source: string;
    title: string;
    url: string;
    published_at: string;
    summary: string | null;
    category: string | null;
    fetched_at: string;
  };
  Insert: {
    id: string;
    source: string;
    title: string;
    url: string;
    published_at: string;
    summary?: string | null;
    category?: string | null;
    fetched_at?: string;
  };
  Update: Partial<NewsCacheTable['Insert']>;
  Relationships: EmptyRels;
};

export type Database = {
  // Required by supabase-js v2.112+ to enable typed Postgrest queries.
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Views: Record<string, never>;
    Tables: {
      accounts: AccountTable;
      categories: CategoryTable;
      transactions: TransactionTable;
      transfers: TransferTable;
      budgets: BudgetTable;
      investments: InvestmentTable;
      dividends: DividendTable;
      insights: InsightTable;
      news_cache: NewsCacheTable;
    };
    Functions: {
      dashboard_balance_timeline: {
        Args: { p_months: number };
        Returns: { date: string; balance_cents: number }[];
      };
      dashboard_category_breakdown: {
        Args: { p_from: string; p_to: string };
        Returns: { category_id: string; amount_cents: number }[];
      };
      dashboard_monthly_totals: {
        Args: { p_months: number };
        Returns: { month: string; income: number; expense: number }[];
      };
    };
  };
};

export const supabase: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** True when the mock data layer is active (no backend calls). */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** API base for Edge Function calls. Defaults to `/api` for both dev and prod. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Convenience: current user id, throws if not signed in. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}