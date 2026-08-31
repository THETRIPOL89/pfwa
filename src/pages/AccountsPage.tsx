import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountFormDialog } from '@/components/accounts/AccountFormDialog';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/utils';
import type { AccountInput } from '@/types/domain';
import { toast } from '@/components/ui/toast';

export function AccountsPage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const transactions = useTransactions({ limit: 5 });
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountInput | undefined>();

  const total = (accounts.data ?? []).reduce((acc, a) => acc + a.balanceCents, 0);

  const handleSubmit = async (input: AccountInput) => {
    if (input.id) {
      await update.mutateAsync({ id: input.id, patch: input });
      toast.success('Conto aggiornato');
    } else {
      await create.mutateAsync(input);
      toast.success('Conto creato');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accounts.data ? `${accounts.data.length} conti totali` : 'Caricamento…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.data && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Saldo totale</div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(total)}</div>
            </div>
          )}
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Nuovo conto
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : (accounts.data ?? []).length === 0
            ? (
              <EmptyState
                icon={<Wallet className="size-5" />}
                title="Nessun conto"
                description="Aggiungi il tuo primo conto per iniziare a tracciare le finanze."
                action={<Button onClick={() => setDialogOpen(true)}>+ Aggiungi conto</Button>}
                className="col-span-full"
              />
            )
            : (accounts.data ?? []).map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onClick={() => {
                    setEditing({ ...acc });
                    setDialogOpen(true);
                  }}
                />
              ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Movimenti recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {(transactions.data?.items ?? []).slice(0, 5).map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  account={accounts.data?.find((a) => a.id === t.accountId)}
                  category={categories.data?.find((c) => c.id === t.categoryId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing as any}
        onSubmit={handleSubmit}
      />
    </div>
  );
}