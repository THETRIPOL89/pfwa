import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import type { Transaction, Account, Category } from '@/types/domain';

export function TransactionRow({
  transaction,
  account,
  category,
  onClick,
}: {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  onClick?: () => void;
}) {
  const isIncome = transaction.kind === 'income';
  const isTransfer = !!transaction.transferId;
  const sign = isIncome ? '+' : '−';
  const amount = isIncome ? transaction.amountCents : -transaction.amountCents;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-colors',
        'hover:bg-accent/60',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          isTransfer
            ? 'bg-info/10 text-info'
            : isIncome
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive',
        )}
      >
        {isTransfer ? (
          <Repeat className="size-4" />
        ) : isIncome ? (
          <ArrowDownLeft className="size-4" />
        ) : (
          <ArrowUpRight className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {transaction.payee ?? (isTransfer ? 'Trasferimento' : 'Senza descrizione')}
          </span>
          {category && (
            <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
              · <Icon name={category.icon} className="inline size-3 -translate-y-px" />{' '}
              {category.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatDate(transaction.occurredAt)}</span>
          {account && (
            <>
              <span>·</span>
              <span className="truncate">{account.name}</span>
            </>
          )}
          {(transaction.tags?.length ?? 0) > 0 && (
            <>
              <span>·</span>
              <span className="truncate">
                {transaction.tags!.slice(0, 2).map((t) => `#${t}`).join(' ')}
              </span>
            </>
          )}
        </div>
      </div>
      <div
        className={cn(
          'shrink-0 text-right text-sm font-semibold tabular-nums',
          isIncome ? 'text-success' : 'text-foreground',
        )}
      >
        {sign}
        {formatCurrency(Math.abs(amount), transaction.currency)}
      </div>
    </button>
  );
}