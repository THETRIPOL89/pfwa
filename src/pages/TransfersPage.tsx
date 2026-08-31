import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { createTransfer } from '@/services/transfers';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export function TransfersPage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const transfers = useTransactions({ limit: 50 });

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const transferRows = (transfers.data?.items ?? []).filter((t) => t.transferId);
  // Keep only one leg per transfer so the list doesn't double-count.
  const seen = new Set<string>();
  const unique = transferRows.filter((t) => {
    if (!t.transferId) return false;
    if (seen.has(t.transferId)) return false;
    seen.add(t.transferId);
    return true;
  });

  const handleSubmit = async () => {
    const cents = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!fromId || !toId || !cents || fromId === toId) {
      toast.error('Compila tutti i campi: i conti devono essere diversi.');
      return;
    }
    setSubmitting(true);
    try {
      await createTransfer({
        fromAccountId: fromId,
        toAccountId: toId,
        amountCents: cents,
        currency: 'EUR',
        occurredAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      toast.success('Trasferimento registrato');
      setAmount('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Trasferimenti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sposta denaro tra conti senza alterare il saldo totale.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nuovo trasferimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Da</Label>
              <Select
                value={fromId}
                onChange={setFromId}
                placeholder="Conto di partenza"
                options={(accounts.data ?? []).map((a) => ({
                  value: a.id,
                  label: `${a.name} · ${formatCurrency(a.balanceCents)}`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>A</Label>
              <Select
                value={toId}
                onChange={setToId}
                placeholder="Conto di destinazione"
                options={(accounts.data ?? []).map((a) => ({
                  value: a.id,
                  label: `${a.name} · ${formatCurrency(a.balanceCents)}`,
                }))}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trf-amount">Importo</Label>
              <Input
                id="trf-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trf-notes">Note (opzionale)</Label>
              <Input
                id="trf-notes"
                placeholder="Es. Risparmio mensile"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              <ArrowLeftRight className="size-4" />
              {submitting ? 'Trasferimento…' : 'Trasferisci'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cronologia</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : unique.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight className="size-5" />}
              title="Nessun trasferimento"
              description="I movimenti tra conti appariranno qui."
            />
          ) : (
            <div className="divide-y">
              {unique.slice(0, 20).map((t) => (
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
    </div>
  );
}