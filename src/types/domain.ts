/**
 * Domain types shared across the app. Mirrors the database schema in
 * supabase/migrations/0001_init.sql but stripped of database-only fields
 * (created_by trigger values, etc.). Money is always represented in
 * integer cents to avoid float arithmetic bugs.
 */

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'crypto_wallet'
  | 'investment';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalanceCents: number;
  /** Design-system token key (e.g. 'cat-indigo') used by AccountCard. */
  color: string;
  /** Lucide icon name. */
  icon: string;
  archived?: boolean;
  institution?: string;
  /** Cached balance in cents — recomputed by trigger in production. */
  balanceCents: number;
};

export type CategoryKind = 'expense' | 'income' | 'both';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  parentId?: string | null;
  isDefault?: boolean;
};

export type TransactionKind = 'expense' | 'income';

export type RecurringRule = {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO date
  count?: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  categoryId?: string | null;
  kind: TransactionKind;
  amountCents: number; // always positive; kind decides direction
  currency: Currency;
  occurredAt: string; // ISO datetime
  payee?: string;
  notes?: string;
  tags?: string[];
  recurringRule?: RecurringRule;
  recurringParentId?: string | null;
  receiptPath?: string | null;
  /** When this transaction is one leg of a transfer, the other leg's id. */
  transferId?: string | null;
};

export type Budget = {
  id: string;
  categoryId: string;
  period: 'weekly' | 'monthly' | 'yearly';
  amountCents: number;
  startsOn: string; // ISO date
  endsOn?: string | null;
};

export type AssetClass = 'stock' | 'etf' | 'bond' | 'crypto' | 'other';

export type Investment = {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCostCents: number;
  currency: Currency;
};

export type Dividend = {
  id: string;
  investmentId: string;
  amountCents: number;
  currency: Currency;
  receivedAt: string;
};

export type MarketQuote = {
  symbol: string;
  priceCents: number;
  currency: Currency;
  change24hPct: number;
  /** Epoch ms of last quote. Used to flag stale data. */
  asOf: number;
};

export type InsightKind =
  | 'spending_pattern'
  | 'budget_warning'
  | 'savings_tip'
  | 'investment_tip'
  | 'anomaly'
  | 'positive_trend';

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';

export type Insight = {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  body: string;
  iconKey: string;
  colorToken: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  generatedAt: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
  category?: 'mercati' | 'crypto' | 'economia' | 'aziende' | 'personale';
};

/* ----------- DTO helpers (input shapes for create/update) ----------- */

export type TransactionInput = Omit<
  Transaction,
  'id' | 'transferId' | 'recurringParentId'
> & { id?: string };

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  currency: Currency;
  occurredAt: string;
  notes?: string;
};

export type AccountInput = Omit<Account, 'id' | 'balanceCents'> & {
  id?: string;
};

export type BudgetInput = Omit<Budget, 'id'> & { id?: string };

export type InvestmentInput = Omit<Investment, 'id'> & { id?: string };