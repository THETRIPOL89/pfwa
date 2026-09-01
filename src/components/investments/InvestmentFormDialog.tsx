import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { fetchLiveQuote } from '@/services/liveQuote';
import type {
  Account,
  AssetClass,
  Currency,
  Investment,
  InvestmentInput,
} from '@/types/domain';

const ASSET_OPTIONS = [
  { value: 'stock', label: 'Azione' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Obbligazione' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Altro' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollaro ($)' },
  { value: 'GBP', label: 'Sterlina (£)' },
  { value: 'CHF', label: 'Franco svizzero' },
];

export function InvestmentFormDialog({
  open,
  onOpenChange,
  initial,
  accounts,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Investment;
  accounts: Account[];
  onSubmit: (input: InvestmentInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [assetClass, setAssetClass] = useState<AssetClass>(initial?.assetClass ?? 'stock');
  const [accountId, setAccountId] = useState(
    initial?.accountId ?? accounts[0]?.id ?? '',
  );
  const [quantity, setQuantity] = useState(initial?.quantity.toString() ?? '');
  const [avgCost, setAvgCost] = useState(
    initial ? (initial.avgCostCents / 100).toString() : '',
  );
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'EUR');
  const [submitting, setSubmitting] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSource, setQuoteSource] = useState<string | null>(null);
  const quoteRequestId = useRef(0);

  useEffect(() => {
    if (open) {
      setSymbol(initial?.symbol ?? '');
      setName(initial?.name ?? '');
      setAssetClass(initial?.assetClass ?? 'stock');
      setAccountId(initial?.accountId ?? accounts[0]?.id ?? '');
      setQuantity(initial?.quantity.toString() ?? '');
      setAvgCost(initial ? (initial.avgCostCents / 100).toString() : '');
      setCurrency(initial?.currency ?? 'EUR');
      setQuoteSource(null);
    }
  }, [open, initial, accounts]);

  // Auto-fetch quote when symbol or assetClass change (debounced), unless
  // we're editing an existing investment (user keeps their avg cost).
  useEffect(() => {
    if (initial) return;
    if (!open) return;
    const trimmed = symbol.trim();
    if (!trimmed) {
      setQuoteSource(null);
      return;
    }
    const requestId = ++quoteRequestId.current;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const quote = await fetchLiveQuote(trimmed, assetClass);
        if (requestId !== quoteRequestId.current) return;
        setAvgCost((quote.priceCents / 100).toString());
        setCurrency(quote.currency);
        setQuoteSource(quote.source);
      } catch (e) {
        if (requestId !== quoteRequestId.current) return;
        setQuoteSource(null);
        // Silently ignore — user can type the price manually.
        console.error('quote fetch failed', e);
      } finally {
        if (requestId === quoteRequestId.current) setQuoteLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [symbol, assetClass, open, initial]);

  const handleManualRefresh = async () => {
    const trimmed = symbol.trim();
    if (!trimmed) {
      toast.error('Inserisci prima il simbolo');
      return;
    }
    setQuoteLoading(true);
    try {
      const quote = await fetchLiveQuote(trimmed, assetClass);
      setAvgCost((quote.priceCents / 100).toString());
      setCurrency(quote.currency);
      setQuoteSource(quote.source);
      toast.success(`Prezzo aggiornato da ${quote.source}`);
    } catch (e) {
      toast.error(`Quote non disponibile: ${e instanceof Error ? e.message : 'errore'}`);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    const qty = Number(quantity.replace(',', '.'));
    if (!symbol.trim() || !name.trim() || !accountId) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('La quantità deve essere maggiore di zero');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        id: initial?.id,
        accountId,
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        assetClass,
        quantity: qty,
        avgCostCents: Math.round(Number(avgCost.replace(',', '.')) * 100),
        currency,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {initial ? 'Modifica investimento' : 'Nuovo investimento'}
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-symbol">Simbolo (ticker)</Label>
              <Input
                id="inv-symbol"
                placeholder="Es. AAPL, ENI.MI, BTC"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nome</Label>
              <Input
                id="inv-name"
                placeholder="Es. Apple Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={assetClass}
                onChange={(v) => setAssetClass(v as AssetClass)}
                options={ASSET_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conto</Label>
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">Quantità</Label>
              <Input
                id="inv-qty"
                type="number"
                step="0.0001"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-cost">Prezzo medio</Label>
              <div className="flex gap-1">
                <Input
                  id="inv-cost"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={avgCost}
                  onChange={(e) => setAvgCost(e.target.value)}
                />
                {!initial && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleManualRefresh}
                    disabled={quoteLoading}
                    aria-label="Aggiorna prezzo"
                    title="Aggiorna prezzo"
                  >
                    {quoteLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                  </Button>
                )}
              </div>
              {quoteSource && (
                <p className="text-[11px] text-muted-foreground">
                  Prezzo auto da {quoteSource}
                </p>
              )}
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
          <Button
            onClick={handleSubmit}
            disabled={submitting || !symbol.trim() || !name.trim() || !accountId || !quantity}
          >
            {submitting ? 'Salvataggio…' : initial ? 'Salva modifiche' : 'Aggiungi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}