import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import type {
  Account,
  Category,
  Transaction,
  TransactionInput,
  TransactionKind,
} from '@/types/domain';

export function TransactionFormDialog({
  open,
  onOpenChange,
  initial,
  accounts,
  categories,
  defaultAccountId,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Transaction;
  accounts: Account[];
  categories: Category[];
  defaultAccountId?: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? 'expense');
  const [accountId, setAccountId] = useState(
    initial?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? '',
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [amount, setAmount] = useState(
    initial ? (initial.amountCents / 100).toString() : '',
  );
  const [payee, setPayee] = useState(initial?.payee ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [date, setDate] = useState(
    initial?.occurredAt
      ? initial.occurredAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setKind(initial?.kind ?? 'expense');
      setAccountId(initial?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? '');
      setCategoryId(initial?.categoryId ?? '');
      setAmount(initial ? (initial.amountCents / 100).toString() : '');
      setPayee(initial?.payee ?? '');
      setNotes(initial?.notes ?? '');
      setTags((initial?.tags ?? []).join(', '));
      setDate(
        initial?.occurredAt
          ? initial.occurredAt.slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      );
    }
  }, [open, initial, defaultAccountId, accounts]);

  const filteredCategories = categories.filter(
    (c) => c.kind === kind || c.kind === 'both',
  );

  const handleSubmit = async () => {
    const cents = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!cents || !accountId) return;
    setSubmitting(true);
    try {
      await onSubmit({
        id: initial?.id,
        accountId,
        categoryId: categoryId || null,
        kind,
        amountCents: Math.abs(cents),
        currency: accounts.find((a) => a.id === accountId)?.currency ?? 'EUR',
        occurredAt: new Date(date).toISOString(),
        payee: payee.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant={initial ? 'modal' : 'sheet-bottom'}>
        <DialogHeader>{initial ? 'Modifica transazione' : 'Nuova transazione'}</DialogHeader>
        <div className="space-y-4">
          <Segmented<TransactionKind>
              value={kind}
              onChange={setKind}
              options={[
                { value: 'expense', label: 'Uscita' },
                { value: 'income', label: 'Entrata' },
              ]}
            />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Importo</Label>
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">Data e ora</Label>
              <Input
                id="tx-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-payee">Beneficiario / Pagatore</Label>
            <Input
              id="tx-payee"
              placeholder="Es. Esselunga, Acme S.p.A."
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Conto</Label>
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Seleziona categoria…"
                options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-tags">Tag (separati da virgola)</Label>
            <Input
              id="tx-tags"
              placeholder="spesa, casa, urgente"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-notes">Note</Label>
            <Textarea
              id="tx-notes"
              placeholder="Note opzionali…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          {initial && onDelete && (
            <Button
              variant="destructive"
              onClick={async () => {
                await onDelete(initial.id);
                onOpenChange(false);
              }}
            >
              Elimina
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !amount || !accountId}>
            {submitting ? 'Salvataggio…' : 'Salva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}