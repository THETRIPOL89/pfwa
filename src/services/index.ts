/* Re-exports + dashboard aggregate RPCs. */
export * from './accounts';
export * from './transactions';
export * from './transfers';
export * from './budgets';
export * from './investments';
export * from './categories';
export * from './insights';
export * from './market';
export * from './crypto';
export * from './news';

import { supabase, USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import { startOfMonth, endOfMonth, groupBy, sum } from '@/lib/utils';

export type BalancePoint = { date: string; balanceCents: number };
export type CategoryBreakdown = { categoryId: string; amountCents: number };

export async function getBalanceTimeline(months = 6): Promise<BalancePoint[]> {
  if (USE_MOCKS) {
    await networkDelay(180);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);

    const openingTotal = sum(db.accounts.map((a) => a.openingBalanceCents));
    const all = db.transactions.slice().sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    const days: BalancePoint[] = [];
    let cursor = new Date(start);
    while (cursor <= today) {
      const dayKey = cursor.toISOString().slice(0, 10);
      const sameDay = all.filter(
        (t) => new Date(t.occurredAt).toISOString().slice(0, 10) === dayKey,
      );
      const delta = sum(
        sameDay.map((t) => (t.kind === 'income' ? t.amountCents : -t.amountCents)),
      );
      const lastBalance = days.length === 0 ? openingTotal : days[days.length - 1].balanceCents;
      days.push({ date: dayKey, balanceCents: lastBalance + delta });
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    return days;
  }
  const { data, error } = await supabase.rpc('dashboard_balance_timeline', { p_months: months });
  if (error) throw error;
  return (data ?? []).map((r) => ({ date: r.date, balanceCents: Number(r.balance_cents) }));
}

export async function getCategoryBreakdown(
  month?: { from: Date; to: Date },
): Promise<CategoryBreakdown[]> {
  if (USE_MOCKS) {
    await networkDelay(180);
    const now = month?.from ?? startOfMonth(new Date());
    const until = month?.to ?? endOfMonth(new Date());
    const inRange = db.transactions.filter((t) => {
      const ts = new Date(t.occurredAt).getTime();
      return t.kind === 'expense' && ts >= now.getTime() && ts <= until.getTime();
    });
    const grouped = groupBy(inRange, (t) => t.categoryId ?? 'uncategorized');
    return Object.entries(grouped).map(([categoryId, list]) => ({
      categoryId,
      amountCents: sum(list.map((t) => t.amountCents)),
    }));
  }
  const from = (month?.from ?? startOfMonth(new Date())).toISOString();
  const to = (month?.to ?? endOfMonth(new Date())).toISOString();
  const { data, error } = await supabase.rpc('dashboard_category_breakdown', {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({ categoryId: r.category_id, amountCents: Number(r.amount_cents) }));
}

export async function getMonthlyTotals(months = 6) {
  if (USE_MOCKS) {
    await networkDelay(160);
    const now = new Date();
    const buckets: { month: string; income: number; expense: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = endOfMonth(monthDate);
      const monthStart = startOfMonth(monthDate);
      const inMonth = db.transactions.filter((t) => {
        const ts = new Date(t.occurredAt).getTime();
        return ts >= monthStart.getTime() && ts <= monthEnd.getTime();
      });
      buckets.push({
        month: monthDate.toISOString().slice(0, 7),
        income: sum(inMonth.filter((t) => t.kind === 'income').map((t) => t.amountCents)),
        expense: sum(inMonth.filter((t) => t.kind === 'expense').map((t) => t.amountCents)),
      });
    }
    return buckets;
  }
  const { data, error } = await supabase.rpc('dashboard_monthly_totals', { p_months: months });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    month: r.month,
    income: Number(r.income),
    expense: Number(r.expense),
  }));
}