import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Account, AccountInput, AccountType, Currency } from '@/types/domain';

const TYPE_OPTIONS = [
  { value: 'checking', label: 'Conto corrente' },
  { value: 'savings', label: 'Risparmio' },
  { value: 'credit_card', label: 'Carta di credito' },
  { value: 'cash', label: 'Contanti' },
  { value: 'crypto_wallet', label: 'Crypto wallet' },
  { value: 'investment', label: 'Investimenti' },
];
const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollaro ($)' },
  { value: 'GBP', label: 'Sterlina (£)' },
  { value: 'CHF', label: 'Franco svizzero' },
];
const COLOR_OPTIONS = [
  { value: 'cat-indigo', label: 'Indaco' },
  { value: 'cat-emerald', label: 'Smeraldo' },
  { value: 'cat-violet', label: 'Viola' },
  { value: 'cat-amber', label: 'Ambra' },
  { value: 'cat-rose', label: 'Rosa' },
  { value: 'cat-sky', label: 'Cielo' },
  { value: 'cat-teal', label: 'Teal' },
  { value: 'cat-orange', label: 'Arancione' },
];

export function AccountFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Account;
  onSubmit: (input: AccountInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'checking');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'EUR');
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [opening, setOpening] = useState(((initial?.openingBalanceCents ?? 0) / 100).toString());
  const [color, setColor] = useState(initial?.color ?? 'cat-indigo');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setType(initial?.type ?? 'checking');
      setCurrency(initial?.currency ?? 'EUR');
      setInstitution(initial?.institution ?? '');
      setOpening(((initial?.openingBalanceCents ?? 0) / 100).toString());
      setColor(initial?.color ?? 'cat-indigo');
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        id: initial?.id,
        name: name.trim(),
        type,
        currency,
        institution: institution.trim() || undefined,
        openingBalanceCents: Math.round(Number(opening.replace(',', '.')) * 100),
        color,
        icon: 'Wallet',
        archived: initial?.archived ?? false,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>{initial ? 'Modifica conto' : 'Nuovo conto'}</DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Nome</Label>
            <Input
              id="acc-name"
              placeholder="Es. Conto Corrente Intesa"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={type}
                onChange={(v) => setType(v as AccountType)}
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valuta</Label>
              <Select
                value={currency}
                onChange={(v) => setCurrency(v as Currency)}
                options={CURRENCY_OPTIONS}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-inst">Istituto (opzionale)</Label>
            <Input
              id="acc-inst"
              placeholder="Es. Intesa Sanpaolo"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">Saldo iniziale</Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colore</Label>
              <Select
                value={color}
                onChange={setColor}
                options={COLOR_OPTIONS}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? 'Salvataggio…' : initial ? 'Salva modifiche' : 'Crea conto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}