import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { AllocationPie } from '@/components/charts/AllocationPie';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useDividends,
  useInvestments,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
} from '@/hooks/useInvestments';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';
import { useAccounts } from '@/hooks/useAccounts';
import { HoldingCard } from '@/components/investments/HoldingCard';
import { InvestmentFormDialog } from '@/components/investments/InvestmentFormDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { InvestmentInput } from '@/types/domain';

export function InvestmentsPage() {
  const investments = useInvestments();
  const dividends = useDividends();
  const accounts = useAccounts();
  const create = useCreateInvestment();
  const update = useUpdateInvestment();
  const remove = useDeleteInvestment();
  const { data: quotes, isLoading: quotesLoading } = useMarketQuotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentInput | undefined>();

  const handleSubmit = async (input: InvestmentInput) => {
    if (input.id) {
      await update.mutateAsync({ id: input.id, patch: input });
      toast.success('Investimento aggiornato');
    } else {
      await create.mutateAsync(input);
      toast.success('Investimento aggiunto');
    }
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    toast.success('Investimento rimosso');
  };

  const quoteBySymbol = useMemo(() => {
    const map = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));
    return map;
  }, [quotes]);

  const portfolioValue = useMemo(() => {
    if (!investments.data) return 0;
    return investments.data.reduce((acc, h) => {
      const quote = quoteBySymbol.get(h.symbol.toUpperCase());
      const price = quote?.priceCents ?? h.avgCostCents;
      return acc + price * h.quantity;
    }, 0);
  }, [investments.data, quoteBySymbol]);

  const portfolioCost = useMemo(() => {
    if (!investments.data) return 0;
    return investments.data.reduce(
      (acc, h) => acc + h.avgCostCents * h.quantity,
      0,
    );
  }, [investments.data]);

  const totalGain = portfolioValue - portfolioCost;
  const totalGainPct = portfolioCost === 0 ? 0 : totalGain / portfolioCost;

  const allocationData = useMemo(() => {
    if (!investments.data) return [];
    return investments.data.map((h) => {
      const quote = quoteBySymbol.get(h.symbol.toUpperCase());
      const price = quote?.priceCents ?? h.avgCostCents;
      const value = price * h.quantity;
      const colorMap: Record<string, string> = {
        stock: 'hsl(var(--cat-blue))',
        etf: 'hsl(var(--cat-indigo))',
        bond: 'hsl(var(--cat-emerald))',
        crypto: 'hsl(var(--cat-amber))',
        other: 'hsl(var(--cat-slate))',
      };
      return {
        name: h.symbol,
        valueCents: Math.round(value),
        color: colorMap[h.assetClass] ?? 'hsl(var(--primary))',
      };
    });
  }, [investments.data, quoteBySymbol]);

  if (investments.isLoading || quotesLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investimenti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Portafoglio · {investments.data?.length ?? 0} posizioni
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuovo investimento
        </Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Valore di mercato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {formatCurrency(portfolioValue)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Costo {formatCurrency(portfolioCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Guadagno / Perdita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={
                totalGain >= 0
                  ? 'text-3xl font-bold tabular-nums text-success'
                  : 'text-3xl font-bold tabular-nums text-destructive'
              }
            >
              {totalGain >= 0 ? '+' : ''}
              {formatCurrency(totalGain)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {(totalGainPct * 100).toFixed(2)}% sul costo
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Dividendi ricevuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {formatCurrency(
                dividends.data?.reduce((acc, d) => acc + d.amountCents, 0) ?? 0,
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {dividends.data?.length ?? 0} distribuzioni
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ChartWrapper
          title="Allocazione"
          description="Per posizione"
          className="lg:col-span-1"
          height={260}
          isLoading={false}
          isEmpty={allocationData.length === 0}
        >
          <AllocationPie data={allocationData} />
        </ChartWrapper>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Posizioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(investments.data ?? []).map((h) => (
                <HoldingCard
                  key={h.id}
                  holding={h}
                  quote={quoteBySymbol.get(h.symbol.toUpperCase())}
                  onClick={() => {
                    setEditing({ ...h });
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Dividendi recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {dividends.data && dividends.data.length > 0 ? (
            <div className="divide-y">
              {dividends.data.map((d) => {
                const holding = investments.data?.find((h) => h.id === d.investmentId);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{holding?.symbol ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(d.receivedAt)}
                      </div>
                    </div>
                    <Badge variant="success">
                      +{formatCurrency(d.amountCents, d.currency)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessun dividendo registrato.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Prezzi via Edge Function <code className="font-mono">/api/market</code> +{' '}
        <code className="font-mono">/api/crypto</code>. In modalità mock i valori
        sono sintetici ma seguono la stessa firma API della produzione.
      </p>

      <InvestmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing as any}
        accounts={accounts.data ?? []}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}