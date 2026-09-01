import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import type { Investment, MarketQuote } from '@/types/domain';

export function HoldingCard({
  holding,
  quote,
  onClick,
}: {
  holding: Investment;
  quote?: MarketQuote;
  onClick?: () => void;
}) {
  const currentPrice = quote?.priceCents ?? holding.avgCostCents;
  const marketValue = currentPrice * holding.quantity;
  const cost = holding.avgCostCents * holding.quantity;
  const gain = marketValue - cost;
  const gainPct = cost === 0 ? 0 : gain / cost;
  const positive = gain >= 0;

  return (
    <Card
      className={cn('p-5', onClick && 'cursor-pointer transition-transform hover:-translate-y-0.5')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{holding.symbol}</h3>
          <p className="text-xs text-muted-foreground">{holding.name}</p>
        </div>
        <Badge variant="outline">{holding.assetClass.toUpperCase()}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Valore
          </div>
          <div className="text-lg font-bold tabular-nums">
            {formatCurrency(marketValue, holding.currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Q.tà
          </div>
          <div className="font-semibold tabular-nums">{holding.quantity}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {positive ? (
            <TrendingUp className="size-3.5 text-success" />
          ) : (
            <TrendingDown className="size-3.5 text-destructive" />
          )}
          <span
            className={cn(
              'tabular-nums font-semibold',
              positive ? 'text-success' : 'text-destructive',
            )}
          >
            {positive ? '+' : ''}
            {formatCurrency(gain, holding.currency)}
          </span>
          <span className="text-muted-foreground">({formatPercent(gainPct)})</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Prezzo {formatCurrency(currentPrice, holding.currency, 'it-IT', { compact: true })}
        </div>
      </div>
    </Card>
  );
}