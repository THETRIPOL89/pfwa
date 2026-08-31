import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { cn, formatCurrency } from '@/lib/utils';
import type { Budget, Category, Transaction } from '@/types/domain';
import { startOfMonth, endOfMonth } from '@/lib/utils';

export function BudgetCard({
  budget,
  category,
  transactions,
}: {
  budget: Budget;
  category?: Category;
  transactions: Transaction[];
}) {
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  const spent = transactions
    .filter((t) => {
      if (t.kind !== 'expense') return false;
      if (t.categoryId !== budget.categoryId) return false;
      const ts = new Date(t.occurredAt).getTime();
      return ts >= start.getTime() && ts <= end.getTime();
    })
    .reduce((acc, t) => acc + t.amountCents, 0);

  const pct = Math.round((spent / budget.amountCents) * 100);
  const tone =
    pct >= 100 ? 'destructive' : pct >= 80 ? 'warning' : 'primary';

  const remaining = budget.amountCents - spent;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {category && (
            <div
              className="flex size-8 items-center justify-center rounded-md"
              style={{
                background: `hsl(var(--${category.color.replace('cat-', '')}) / 0.15)`,
                color: `hsl(var(--${category.color.replace('cat-', '')}))`,
              }}
            >
              <Icon name={category.icon} className="size-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold">{category?.name ?? 'Categoria'}</h3>
            <p className="text-xs text-muted-foreground">
              Mensile · {formatCurrency(budget.amountCents)}
            </p>
          </div>
        </div>
        {pct >= 100 ? (
          <Badge variant="destructive">Superato</Badge>
        ) : pct >= 80 ? (
          <Badge variant="warning">Vicino al limite</Badge>
        ) : (
          <Badge variant="success">In linea</Badge>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <Progress value={spent} max={budget.amountCents} tone={tone as any} />
        <div className="flex items-center justify-between text-xs">
          <span className="tabular-nums font-medium">{formatCurrency(spent)}</span>
          <span
            className={cn(
              'tabular-nums',
              remaining < 0 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {remaining < 0
              ? `${formatCurrency(Math.abs(remaining))} oltre`
              : `${formatCurrency(remaining)} rimasti`}
          </span>
        </div>
      </div>
    </Card>
  );
}