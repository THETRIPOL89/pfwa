import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { timeAgo } from '@/lib/utils';
import type { Insight } from '@/types/domain';
import { cn } from '@/lib/utils';

const TONE: Record<Insight['colorToken'], { ring: string; bg: string; text: string }> = {
  primary: {
    ring: 'ring-primary/30',
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  success: {
    ring: 'ring-success/30',
    bg: 'bg-success/10',
    text: 'text-success',
  },
  warning: {
    ring: 'ring-warning/30',
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  destructive: {
    ring: 'ring-destructive/30',
    bg: 'bg-destructive/10',
    text: 'text-destructive',
  },
  info: {
    ring: 'ring-info/30',
    bg: 'bg-info/10',
    text: 'text-info',
  },
};

export function InsightCard({ insight, compact }: { insight: Insight; compact?: boolean }) {
  const tone = TONE[insight.colorToken];
  return (
    <Card className={cn('relative h-full overflow-hidden p-5', tone.ring && 'ring-1')}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            tone.bg,
            tone.text,
          )}
        >
          <Icon name={insight.iconKey} className="size-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold leading-snug">{insight.title}</h4>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {insight.body}
            </p>
          )}
          <p className={cn('mt-2 text-[11px]', tone.text)}>
            {timeAgo(insight.generatedAt)} · {insight.kind.replace('_', ' ')}
          </p>
        </div>
      </div>
    </Card>
  );
}