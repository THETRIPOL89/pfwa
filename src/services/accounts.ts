import { supabase, USE_MOCKS, requireUserId, type Database } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { Account, AccountInput, AccountType, Currency } from '@/types/domain';

/**
 * Snake_case row → camelCase domain type. Keeps the rest of the app
 * talking in the `domain.ts` vocabulary while Supabase returns the
 * SQL column names.
 */
type AccountRow = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance_cents: number;
  balance_cents: number;
  color: string;
  icon: string;
  institution: string | null;
  archived: boolean;
};

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    currency: r.currency as Currency,
    openingBalanceCents: r.opening_balance_cents,
    balanceCents: r.balance_cents,
    color: r.color,
    icon: r.icon,
    institution: r.institution ?? undefined,
    archived: r.archived,
  };
}

export async function listAccounts(): Promise<Account[]> {
  if (USE_MOCKS) {
    await networkDelay();
    return [...db.accounts];
  }
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAccount);
}

export async function getAccount(id: string): Promise<Account | null> {
  if (USE_MOCKS) {
    await networkDelay(150);
    return db.accounts.find((a) => a.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAccount(data) : null;
}

export async function createAccount(input: AccountInput): Promise<Account> {
  if (USE_MOCKS) {
    await networkDelay(200);
    const account: Account = {
      ...input,
      id: input.id ?? db.nextId('acc'),
      balanceCents: input.openingBalanceCents,
    };
    db.accounts.push(account);
    return account;
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      opening_balance_cents: input.openingBalanceCents,
      balance_cents: input.openingBalanceCents,
      color: input.color,
      icon: input.icon,
      institution: input.institution ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToAccount(data);
}

export async function updateAccount(
  id: string,
  patch: Partial<AccountInput>,
): Promise<Account> {
  if (USE_MOCKS) {
    await networkDelay(200);
    const idx = db.accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    const updated = { ...db.accounts[idx], ...patch };
    db.accounts[idx] = updated;
    return updated;
  }
  const update: Database['public']['Tables']['accounts']['Update'] = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.openingBalanceCents !== undefined)
    update.opening_balance_cents = patch.openingBalanceCents;
  if (patch.color !== undefined) update.color = patch.color;
  if (patch.icon !== undefined) update.icon = patch.icon;
  if (patch.institution !== undefined) update.institution = patch.institution;
  if (patch.archived !== undefined) update.archived = patch.archived;

  const { data, error } = await supabase
    .from('accounts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToAccount(data);
}

export async function deleteAccount(id: string): Promise<void> {
  if (USE_MOCKS) {
    await networkDelay(150);
    db.accounts = db.accounts.filter((a) => a.id !== id);
    return;
  }
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}