import { supabase, USE_MOCKS, requireUserId } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { TransferInput, Transaction, Currency } from '@/types/domain';

type TxRow = {
  id: string;
  account_id: string;
  category_id: string | null;
  kind: 'expense' | 'income';
  amount_cents: number;
  currency: string;
  occurred_at: string;
  payee: string | null;
  notes: string | null;
  tags: string[];
  transfer_id: string | null;
};

function rowToTransaction(r: TxRow): Transaction {
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

export async function createTransfer(input: TransferInput): Promise<Transaction[]> {
  if (USE_MOCKS) {
    await networkDelay(220);
    const transferId = `tf-${Math.random().toString(36).slice(2, 10)}`;
    const outgoing: Transaction = {
      id: db.nextId('tx'),
      accountId: input.fromAccountId,
      kind: 'expense',
      amountCents: input.amountCents,
      currency: input.currency,
      occurredAt: input.occurredAt,
      notes: input.notes,
      payee: 'Trasferimento in uscita',
      categoryId: null,
      transferId,
    };
    const incoming: Transaction = {
      ...outgoing,
      id: db.nextId('tx'),
      accountId: input.toAccountId,
      kind: 'income',
      payee: 'Trasferimento in entrata',
    };
    db.transactions.unshift(incoming, outgoing);
    const src = db.accounts.find((a) => a.id === input.fromAccountId);
    const dst = db.accounts.find((a) => a.id === input.toAccountId);
    if (src) src.balanceCents -= input.amountCents;
    if (dst) dst.balanceCents += input.amountCents;
    return [outgoing, incoming];
  }

  const userId = await requireUserId();
  // 1. Create the parent transfer row so both legs share the FK.
  const { data: transfer, error: tErr } = await supabase
    .from('transfers')
    .insert({
      user_id: userId,
      from_account_id: input.fromAccountId,
      to_account_id: input.toAccountId,
      amount_cents: input.amountCents,
      currency: input.currency,
      occurred_at: input.occurredAt,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (tErr) throw tErr;

  // 2. Insert both legs. ROLLBACK on failure is handled by deleting the
  // transfer row + the first leg when the second insert fails.
  const legs = [
    {
      user_id: userId,
      account_id: input.fromAccountId,
      kind: 'expense' as const,
      amount_cents: input.amountCents,
      currency: input.currency,
      occurred_at: input.occurredAt,
      payee: 'Trasferimento in uscita',
      notes: input.notes ?? null,
      transfer_id: transfer.id,
    },
    {
      user_id: userId,
      account_id: input.toAccountId,
      kind: 'income' as const,
      amount_cents: input.amountCents,
      currency: input.currency,
      occurred_at: input.occurredAt,
      payee: 'Trasferimento in entrata',
      notes: input.notes ?? null,
      transfer_id: transfer.id,
    },
  ];
  const { data, error } = await supabase.from('transactions').insert(legs).select('*');
  if (error) {
    await supabase.from('transfers').delete().eq('id', transfer.id);
    throw error;
  }
  return (data ?? []).map(rowToTransaction);
}