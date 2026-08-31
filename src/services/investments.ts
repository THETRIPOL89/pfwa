import { supabase, USE_MOCKS, requireUserId, type Database } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type {
  Investment,
  InvestmentInput,
  Dividend,
  AssetClass,
  Currency,
} from '@/types/domain';

type InvestmentRow = {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  name: string;
  asset_class: AssetClass;
  quantity: number;
  avg_cost_cents: number;
  currency: string;
};

function rowToInvestment(r: InvestmentRow): Investment {
  return {
    id: r.id,
    accountId: r.account_id,
    symbol: r.symbol,
    name: r.name,
    assetClass: r.asset_class,
    quantity: Number(r.quantity),
    avgCostCents: r.avg_cost_cents,
    currency: r.currency as Currency,
  };
}

export async function listInvestments(): Promise<Investment[]> {
  if (USE_MOCKS) {
    await networkDelay(150);
    return [...db.investments];
  }
  const { data, error } = await supabase.from('investments').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToInvestment);
}

export async function listDividends(): Promise<Dividend[]> {
  if (USE_MOCKS) {
    await networkDelay(120);
    return [...db.dividends];
  }
  const { data, error } = await supabase.from('dividends').select('*');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    investmentId: r.investment_id,
    amountCents: r.amount_cents,
    currency: r.currency as Currency,
    receivedAt: r.received_at,
  }));
}

export async function createInvestment(input: InvestmentInput): Promise<Investment> {
  if (USE_MOCKS) {
    await networkDelay(200);
    const investment: Investment = { ...input, id: input.id ?? db.nextId('inv') };
    db.investments.push(investment);
    return investment;
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      account_id: input.accountId,
      symbol: input.symbol,
      name: input.name,
      asset_class: input.assetClass,
      quantity: input.quantity,
      avg_cost_cents: input.avgCostCents,
      currency: input.currency,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToInvestment(data);
}

export async function updateInvestment(
  id: string,
  patch: Partial<InvestmentInput>,
): Promise<Investment> {
  if (USE_MOCKS) {
    await networkDelay(180);
    const idx = db.investments.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Investment not found');
    db.investments[idx] = { ...db.investments[idx], ...patch };
    return db.investments[idx];
  }
  const update: Database['public']['Tables']['investments']['Update'] = {};
  if (patch.accountId !== undefined) update.account_id = patch.accountId;
  if (patch.symbol !== undefined) update.symbol = patch.symbol;
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.assetClass !== undefined) update.asset_class = patch.assetClass;
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.avgCostCents !== undefined) update.avg_cost_cents = patch.avgCostCents;
  if (patch.currency !== undefined) update.currency = patch.currency;
  const { data, error } = await supabase
    .from('investments')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToInvestment(data);
}

export async function deleteInvestment(id: string): Promise<void> {
  if (USE_MOCKS) {
    await networkDelay(120);
    db.investments = db.investments.filter((i) => i.id !== id);
    return;
  }
  const { error } = await supabase.from('investments').delete().eq('id', id);
  if (error) throw error;
}