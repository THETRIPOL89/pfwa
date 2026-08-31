import { useMemo, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog';
import { TransactionFilters, type FiltersState } from '@/components/transactions/TransactionFilters';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';
import type { TransactionInput } from '@/types/domain';
import { toast } from '@/components/ui/toast';

const PAGE_SIZE = 25;

export function TransactionsPage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();

  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    accountId: '',
    categoryId: '',
    kind: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionInput | undefined>();

  const txArgs = useMemo(
    () => ({
      filters: {
        search: filters.search || undefined,
        accountId: filters.accountId || undefined,
        categoryId: filters.categoryId || undefined,
        kind: filters.kind === 'all' ? undefined : filters.kind,
        from: filters.from || undefined,
        to: filters.to || undefined,
      },
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [filters, page],
  );

  const transactions = useTransactions(txArgs);

  const handleSubmit = async (input: TransactionInput) => {
    if (input.id) {
      await update.mutateAsync({ id: input.id, patch: input });
      toast.success('Transazione aggiornata');
    } else {
      await create.mutateAsync(input);
      toast.success('Transazione registrata');
    }
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    toast.success('Transazione eliminata');
  };

  const total = transactions.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Aggregated totals for the visible list.
  const totals = useMemo(() => {
    const items = transactions.data?.items ?? [];
    let income = 0;
    let expense = 0;
    for (const t of items) {
      if (t.kind === 'income') income += t.amountCents;
      else expense += t.amountCents;
    }
    return { income, expense, net: income - expense };
  }, [transactions.data]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transazioni</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0
              ? 'Nessuna transazione trovata'
              : `${total} transazioni · pagina ${page + 1} di ${pages}`}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuova transazione
        </Button>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4">
          <TransactionFilters
            accounts={accounts.data ?? []}
            categories={categories.data ?? []}
            value={filters}
            onChange={(f) => {
              setPage(0);
              setFilters(f);
            }}
          />

          {/* Summary chips for the visible page */}
          {transactions.data && transactions.data.items.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="success">
                Entrate {formatCurrency(totals.income)}
              </Badge>
              <Badge variant="destructive">
                Uscite {formatCurrency(totals.expense)}
              </Badge>
              <Badge variant={totals.net >= 0 ? 'info' : 'warning'}>
                Netto {formatCurrency(totals.net)}
              </Badge>
            </div>
          )}

          {transactions.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !transactions.data || transactions.data.items.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="Nessuna transazione"
              description="Prova a cambiare i filtri o aggiungi la tua prima transazione."
              action={
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Nuova transazione
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {transactions.data.items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  account={accounts.data?.find((a) => a.id === t.accountId)}
                  category={categories.data?.find((c) => c.id === t.categoryId)}
                  onClick={() => {
                    setEditing({ ...t });
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Precedente
              </Button>
              <span className="text-xs text-muted-foreground">
                Pagina {page + 1} / {pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pages - 1}
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              >
                Successiva →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing as any}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}