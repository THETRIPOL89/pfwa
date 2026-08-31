import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { EmptyState } from '@/components/ui/empty-state';
import { PiggyBank } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';

export function BudgetsPage() {
  const budgets = useBudgets();
  const categories = useCategories();
  // Pull a generous slice of transactions; client-side aggregation is fast
  // for the demo's <500 rows.
  const txs = useTransactions({ limit: 500 });

  const txList = useMemo(() => txs.data?.items ?? [], [txs.data]);

  if (budgets.isLoading || categories.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const list = budgets.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<PiggyBank className="size-5" />}
        title="Nessun budget"
        description="Crea budget mensili per tenere sotto controllo le spese per categoria."
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} budget mensili attivi
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <BudgetCard
            key={b.id}
            budget={b}
            category={categories.data?.find((c) => c.id === b.categoryId)}
            transactions={txList}
          />
        ))}
      </div>
    </div>
  );
}