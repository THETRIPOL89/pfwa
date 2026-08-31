import { supabase, USE_MOCKS, requireUserId, type Database } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type {
  Transaction,
  TransactionInput,
  TransactionKind,
  Currency,
} from '@/types/domain';

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  kind?: TransactionKind;
  /** Free-text on payee / notes / tags. */
  search?: string;
  /** ISO date inclusive lower bound. */
  from?: string;
  /** ISO date inclusive upper bound. */
  to?: string;
  /** Min amount in cents. */
  minAmountCents?: number;
  /** Max amount in cents. */
  maxAmountCents?: number;
};

export type TransactionSort = {
  by: 'occurredAt' | 'amountCents';
  dir: 'asc' | 'desc';
};

export type ListTransactionsArgs = {
  filters?: TransactionFilters;
  sort?: TransactionSort;
  limit?: number;
  offset?: number;
};

export type PaginatedTransactions = {
  items: Transaction[];
  total: number;
};

type TransactionRow = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  kind: TransactionKind;
  amount_cents: number;
  currency: string;
  occurred_at: string;
  payee: string | null;
  notes: string | null;
  tags: string[];
  transfer_id: string | null;
};

function rowToTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    accountId: r.account_id,
    categoryId: r.category_id,
    kind: r.kind,
    amountCents: r.amount_cents,
    currency: r.currency as Currency,
    occurredAt: r.occurred_at,
    payee: r.payee ?? undefined,
    notes: r.notes ?? undefined,
    tags: r.tags ?? [],
    transferId: r.transfer_id,
  };
}

export async function listTransactions(
  args: ListTransactionsArgs = {},
): Promise<PaginatedTransactions> {
  const {
    filters = {},
    sort = { by: 'occurredAt', dir: 'desc' },
    limit = 50,
    offset = 0,
  } = args;

  if (USE_MOCKS) {
    await networkDelay(200);
    let rows = db.transactions.slice();

    if (filters.accountId) rows = rows.filter((t) => t.accountId === filters.accountId);
    if (filters.categoryId) rows = rows.filter((t) => t.categoryId === filters.categoryId);
    if (filters.kind) rows = rows.filter((t) => t.kind === filters.kind);
    if (filters.from) {
      const fromMs = new Date(filters.from).getTime();
      rows = rows.filter((t) => new Date(t.occurredAt).getTime() >= fromMs);
    }
    if (filters.to) {
      const toMs = new Date(filters.to).getTime();
      rows = rows.filter((t) => new Date(t.occurredAt).getTime() <= toMs);
    }
    if (filters.minAmountCents != null) {
      rows = rows.filter((t) => t.amountCents >= (filters.minAmountCents ?? 0));
    }
    if (filters.maxAmountCents != null) {
      rows = rows.filter((t) => t.amountCents <= (filters.maxAmountCents ?? Infinity));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((t) =>
        [t.payee, t.notes, ...(t.tags ?? [])]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q)),
      );
    }

    rows.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.by === 'amountCents') return (a.amountCents - b.amountCents) * dir;
      return (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()) * dir;
    });

    const total = rows.length;
    const items = rows.slice(offset, offset + limit);
    return { items, total };
  }

  let q = supabase.from('transactions').select('*', { count: 'exact' });
  if (filters.accountId) q = q.eq('account_id', filters.accountId);
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
  if (filters.kind) q = q.eq('kind', filters.kind);
  if (filters.from) q = q.gte('occurred_at', filters.from);
  if (filters.to) q = q.lte('occurred_at', filters.to);
  if (filters.minAmountCents != null) q = q.gte('amount_cents', filters.minAmountCents);
  if (filters.maxAmountCents != null) q = q.lte('amount_cents', filters.maxAmountCents);
  // Free-text search runs on the client side; tag/payee/notes ILIKE isn't
  // worth an extra roundtrip given the typical dataset size.
  q =
    sort.by === 'amountCents'
      ? q.order('amount_cents', { ascending: sort.dir === 'asc' })
      : q.order('occurred_at', { ascending: sort.dir === 'asc' });
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) throw error;

  let items = (data ?? []).map(rowToTransaction);
  if (filters.search) {
    const q2 = filters.search.toLowerCase();
    items = items.filter((t) =>
      [t.payee, t.notes, ...(t.tags ?? [])]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q2)),
    );
  }
  return { items, total: count ?? items.length };
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  if (USE_MOCKS) {
    await networkDelay(180);
    const tx: Transaction = {
      ...input,
      id: input.id ?? db.nextId('tx'),
      currency: input.currency ?? 'EUR',
    };
    db.transactions.unshift(tx);
    const acc = db.accounts.find((a) => a.id === tx.accountId);
    if (acc) acc.balanceCents += tx.kind === 'income' ? tx.amountCents : -tx.amountCents;
    return tx;
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: input.accountId,
      category_id: input.categoryId ?? null,
      kind: input.kind,
      amount_cents: input.amountCents,
      currency: input.currency,
      occurred_at: input.occurredAt,
      payee: input.payee ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToTransaction(data);
}

export async function updateTransaction(
  id: string,
  patch: Partial<TransactionInput>,
): Promise<Transaction> {
  if (USE_MOCKS) {
    await networkDelay(150);
    const idx = db.transactions.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transaction not found');
    const prev = db.transactions[idx];
    const updated: Transaction = { ...prev, ...patch };
    const prevAcc = db.accounts.find((a) => a.id === prev.accountId);
    if (prevAcc) prevAcc.balanceCents -= prev.kind === 'income' ? prev.amountCents : -prev.amountCents;
    const newAcc = db.accounts.find((a) => a.id === updated.accountId);
    if (newAcc) newAcc.balanceCents += updated.kind === 'income' ? updated.amountCents : -updated.amountCents;
    db.transactions[idx] = updated;
    return updated;
  }
  const update: Database['public']['Tables']['transactions']['Update'] = {};
  if (patch.accountId !== undefined) update.account_id = patch.accountId;
  if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
  if (patch.kind !== undefined) update.kind = patch.kind;
  if (patch.amountCents !== undefined) update.amount_cents = patch.amountCents;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.occurredAt !== undefined) update.occurred_at = patch.occurredAt;
  if (patch.payee !== undefined) update.payee = patch.payee;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.tags !== undefined) update.tags = patch.tags;

  const { data, error } = await supabase
    .from('transactions')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToTransaction(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (USE_MOCKS) {
    await networkDelay(120);
    const idx = db.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [removed] = db.transactions.splice(idx, 1);
    const acc = db.accounts.find((a) => a.id === removed.accountId);
    if (acc) acc.balanceCents -= removed.kind === 'income' ? removed.amountCents : -removed.amountCents;
    return;
  }
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}