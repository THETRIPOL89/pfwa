import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Single source of truth for chart loading/empty/error states.
 * Every chart sits inside a ChartWrapper so the dashboard feels
 * consistent and a11y is handled in one place.
 */
export function ChartWrapper({
  title,
  description,
  isLoading,
  isError,
  isEmpty,
  height = 280,
  className,
  children,
  action,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  height?: number;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn('card-surface p-5', className)}>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div style={{ height }} className="relative">
        {isLoading ? (
          <Skeleton className="absolute inset-0 w-full" />
        ) : isError ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            Errore nel caricamento del grafico.
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<BarChart3 className="size-5" />}
            title="Nessun dato"
            description="Aggiungi transazioni per popolare il grafico."
            className="h-full"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}