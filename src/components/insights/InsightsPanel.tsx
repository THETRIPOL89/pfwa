import { useInsights, useRefreshInsights } from '@/hooks/useInsights';
import { InsightCard } from './InsightCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Sparkles, RefreshCcw } from 'lucide-react';

export function InsightsPanel({ limit }: { limit?: number }) {
  const { data, isLoading } = useInsights();
  const refresh = useRefreshInsights();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="size-5" />}
        title="Nessun insight ancora"
        description="Aggiungi qualche transazione per ricevere suggerimenti personalizzati."
      />
    );
  }

  const sorted = [...data].sort((a, b) => {
    const order = { critical: 0, warning: 1, success: 2, info: 3 } as const;
    return order[a.severity] - order[b.severity];
  });
  const items = limit ? sorted.slice(0, limit) : sorted;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          AI Insights
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          <RefreshCcw
            className={refresh.isPending ? 'size-3.5 animate-spin' : 'size-3.5'}
          />
          {refresh.isPending ? 'Generazione…' : 'Rigenera'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <InsightCard key={i.id} insight={i} />
        ))}
      </div>
    </div>
  );
}