import { supabase, USE_MOCKS, requireUserId, type Database } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { Budget, BudgetInput } from '@/types/domain';

type BudgetRow = {
  id: string;
  user_id: string;
  category_id: string;
  period: 'weekly' | 'monthly' | 'yearly';
  amount_cents: number;
  starts_on: string;
  ends_on: string | null;
};

function rowToBudget(r: BudgetRow): Budget {
  return {
    id: r.id,
    categoryId: r.category_id,
    period: r.period,
    amountCents: r.amount_cents,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
  };
}

export async function listBudgets(): Promise<Budget[]> {
  if (USE_MOCKS) {
    await networkDelay(150);
    return [...db.budgets];
  }
  const { data, error } = await supabase.from('budgets').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToBudget);
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  if (USE_MOCKS) {
    await networkDelay(180);
    const budget: Budget = { ...input, id: input.id ?? db.nextId('bud') };
    db.budgets.push(budget);
    return budget;
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      category_id: input.categoryId,
      period: input.period,
      amount_cents: input.amountCents,
      starts_on: input.startsOn,
      ends_on: input.endsOn ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToBudget(data);
}

export async function updateBudget(id: string, patch: Partial<BudgetInput>): Promise<Budget> {
  if (USE_MOCKS) {
    await networkDelay(150);
    const idx = db.budgets.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Budget not found');
    db.budgets[idx] = { ...db.budgets[idx], ...patch };
    return db.budgets[idx];
  }
  const update: Database['public']['Tables']['budgets']['Update'] = {};
  if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
  if (patch.period !== undefined) update.period = patch.period;
  if (patch.amountCents !== undefined) update.amount_cents = patch.amountCents;
  if (patch.startsOn !== undefined) update.starts_on = patch.startsOn;
  if (patch.endsOn !== undefined) update.ends_on = patch.endsOn;
  const { data, error } = await supabase
    .from('budgets')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToBudget(data);
}

export async function deleteBudget(id: string): Promise<void> {
  if (USE_MOCKS) {
    await networkDelay(120);
    db.budgets = db.budgets.filter((b) => b.id !== id);
    return;
  }
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}