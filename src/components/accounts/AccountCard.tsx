import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account } from '@/types/domain';

const TYPE_LABEL: Record<Account['type'], string> = {
  checking: 'Conto corrente',
  savings: 'Risparmio',
  credit_card: 'Carta di credito',
  cash: 'Contanti',
  crypto_wallet: 'Crypto wallet',
  investment: 'Investimenti',
};

export function AccountCard({
  account,
  onClick,
}: {
  account: Account;
  onClick?: () => void;
}) {
  const isNegative = account.balanceCents < 0;
  return (
    <Card
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group p-5 transition-all',
        onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-elevated',
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            `bg-${account.color}/15 text-${account.color}`,
          )}
          style={{ color: `hsl(var(--${account.color.replace('cat-', '')}))` }}
        >
          <Icon name={account.icon} className="size-5" fallback="Wallet" />
        </div>
        <Badge variant="outline">{TYPE_LABEL[account.type]}</Badge>
      </div>
      <div className="mt-4">
        <h3 className="truncate text-sm font-semibold">{account.name}</h3>
        {account.institution && (
          <p className="truncate text-xs text-muted-foreground">{account.institution}</p>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div
          className={cn(
            'text-xl font-bold tabular-nums',
            isNegative ? 'text-destructive' : 'text-foreground',
          )}
        >
          {formatCurrency(account.balanceCents, account.currency)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {account.currency}
        </div>
      </div>
    </Card>
  );
}