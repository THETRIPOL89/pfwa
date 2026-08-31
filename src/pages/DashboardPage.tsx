import { useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { AreaBalanceChart } from '@/components/charts/AreaBalanceChart';
import { DonutCategories } from '@/components/charts/DonutCategories';
import { BarIncomeExpense } from '@/components/charts/BarIncomeExpense';
import { Sparkline } from '@/components/charts/Sparkline';
import { NewsCard } from '@/components/news/NewsCard';
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import {
  useAccounts,
} from '@/hooks/useAccounts';
import {
  useBalanceTimeline,
  useCategoryBreakdown,
  useMonthlyTotals,
} from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useNews } from '@/hooks/useNews';
import { cn, formatCurrency, formatPercent, startOfMonth, endOfMonth } from '@/lib/utils';
import { Link } from 'react-router-dom';

function KPICard({
  label,
  value,
  hint,
  trend,
  icon: IconCmp,
  tone = 'default',
  sparkData,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: number; positiveIsGood?: boolean };
  icon: React.ElementType;
  tone?: 'default' | 'success' | 'destructive' | 'primary';
  sparkData?: number[];
}) {
  const toneRing =
    tone === 'success'
      ? 'text-success'
      : tone === 'destructive'
        ? 'text-destructive'
        : tone === 'primary'
          ? 'text-primary'
          : 'text-foreground';
  const trendUp = trend && trend.value > 0;
  const trendIsPositive = trend && (trendUp ? trend.positiveIsGood !== false : trend.positiveIsGood === true);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <IconCmp className="size-3.5" />
          {label}
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              trendIsPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {formatPercent(Math.abs(trend.value), 'it-IT', 0)}
          </span>
        )}
      </div>
      <div className={cn('mt-2 text-2xl font-bold tabular-nums', toneRing)}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3 h-8 -mx-1">
          <Sparkline data={sparkData} color={`hsl(var(--${tone === 'default' ? 'primary' : tone}))`} />
        </div>
      )}
    </Card>
  );
}

function KPISkeleton() {
  return <Skeleton className="h-28 w-full" />;
}

export function DashboardPage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const transactions = useTransactions({ limit: 8 });
  const news = useNews();
  const balance = useBalanceTimeline(6);
  const breakdown = useCategoryBreakdown();
  const monthly = useMonthlyTotals(6);

  // KPI calculations
  const totals = useMemo(() => {
    if (!accounts.data) return null;
    const totalBalance = accounts.data.reduce((acc, a) => acc + a.balanceCents, 0);
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const monthTx = (transactions.data?.items ?? []).filter((t) => {
      const ts = new Date(t.occurredAt).getTime();
      return ts >= start.getTime() && ts <= end.getTime();
    });
    const income = monthTx
      .filter((t) => t.kind === 'income')
      .reduce((acc, t) => acc + t.amountCents, 0);
    const expense = monthTx
      .filter((t) => t.kind === 'expense')
      .reduce((acc, t) => acc + t.amountCents, 0);
    const savingsRate = income === 0 ? 0 : Math.max(0, (income - expense) / income);
    return { totalBalance, income, expense, savingsRate };
  }, [accounts.data, transactions.data]);

  const incomeSpark = monthly.data?.map((m) => m.income) ?? [];
  const expenseSpark = monthly.data?.map((m) => m.expense) ?? [];
  const balanceSpark = balance.data?.map((b) => b.balanceCents) ?? [];

  // Hoisted trend computations — keeping ternaries out of JSX avoids
  // tripping Babel's JSX parser when the inner expression contains a
  // multi-line ternary inside an object literal.
  const incomeTrend = useMemo(() => {
    if (!monthly.data || monthly.data.length < 2) return undefined;
    const prev = monthly.data[monthly.data.length - 2];
    const curr = monthly.data[monthly.data.length - 1];
    return {
      value: (curr.income - prev.income) / Math.max(1, prev.income),
    };
  }, [monthly.data]);

  const expenseTrend = useMemo(() => {
    if (!monthly.data || monthly.data.length < 2) return undefined;
    const prev = monthly.data[monthly.data.length - 2];
    const curr = monthly.data[monthly.data.length - 1];
    return {
      value: (curr.expense - prev.expense) / Math.max(1, prev.expense),
      positiveIsGood: false,
    };
  }, [monthly.data]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bentornato, Marco 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ecco una sintesi della tua situazione finanziaria.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/transactions">Vedi tutte le transazioni</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/transactions">+ Nuova transazione</Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {totals === null ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : (
          <>
            <KPICard
              label="Saldo totale"
              value={formatCurrency(totals.totalBalance)}
              hint={`${accounts.data?.length ?? 0} conti attivi`}
              icon={Wallet}
              tone="primary"
              sparkData={balanceSpark.slice(-12)}
            />
            <KPICard
              label="Entrate del mese"
              value={formatCurrency(totals.income)}
              hint="Stipendio + altre entrate"
              icon={ArrowDownRight}
              tone="success"
              trend={incomeTrend}
              sparkData={incomeSpark}
            />
            <KPICard
              label="Uscite del mese"
              value={formatCurrency(totals.expense)}
              hint="Tutte le spese registrate"
              icon={ArrowUpRight}
              tone="destructive"
              trend={expenseTrend}
              sparkData={expenseSpark}
            />
            <KPICard
              label="Tasso di risparmio"
              value={formatPercent(totals.savingsRate)}
              hint={totals.savingsRate >= 0.2 ? 'Ottimo ritmo!' : 'Prova ad arrivare al 20%'}
              icon={PiggyBank}
              tone={totals.savingsRate >= 0.2 ? 'success' : 'default'}
            />
          </>
        )}
      </section>

      {/* AI Insights + Balance chart */}
      <section className="grid gap-4 lg:grid-cols-12">
        <ChartWrapper
          title="Andamento saldo"
          description="Saldo cumulativo negli ultimi 6 mesi"
          isLoading={balance.isLoading}
          isError={balance.isError}
          isEmpty={!balance.data || balance.data.length === 0}
          className="lg:col-span-8"
        >
          {balance.data && <AreaBalanceChart data={balance.data} />}
        </ChartWrapper>
        <div className="lg:col-span-4">
          <Card className="p-5">
            <InsightsPanel limit={3} />
          </Card>
        </div>
      </section>

      {/* Bar + Donut */}
      <section className="grid gap-4 lg:grid-cols-12">
        <ChartWrapper
          title="Entrate vs Uscite"
          description="Confronto mensile"
          isLoading={monthly.isLoading}
          isEmpty={!monthly.data || monthly.data.length === 0}
          className="lg:col-span-7"
        >
          {monthly.data && <BarIncomeExpense data={monthly.data} />}
        </ChartWrapper>
        <ChartWrapper
          title="Spese per categoria"
          description="Mese corrente"
          isLoading={breakdown.isLoading || categories.isLoading}
          isEmpty={!breakdown.data || breakdown.data.length === 0}
          className="lg:col-span-5"
          height={260}
        >
          {breakdown.data && categories.data && (
            <DonutCategories data={breakdown.data} categories={categories.data} />
          )}
        </ChartWrapper>
      </section>

      {/* News */}
      <section>
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight">Notizie di mercato</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/news">Vedi tutte</Link>
          </Button>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {news.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            : (news.data ?? [])
                .slice(0, 6)
                .map((article) => <NewsCard key={article.id} article={article} />)}
        </div>
      </section>

      {/* Latest transactions */}
      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Ultime transazioni</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">Vedi tutte</Link>
          </Button>
        </header>
        <Card className="p-3">
          {transactions.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {(transactions.data?.items ?? []).map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  account={accounts.data?.find((a) => a.id === t.accountId)}
                  category={categories.data?.find((c) => c.id === t.categoryId)}
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}