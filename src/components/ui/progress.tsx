import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({
  value,
  max = 100,
  tone = 'primary',
  className,
}: {
  value: number;
  max?: number;
  tone?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const toneClass =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
        ? 'bg-warning'
        : tone === 'destructive'
          ? 'bg-destructive'
          : 'bg-primary';
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn('h-full transition-[width] duration-500 ease-out', toneClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}