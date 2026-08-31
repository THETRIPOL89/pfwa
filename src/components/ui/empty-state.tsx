import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Empty-state block — friendly placeholder used when a list has no data
 * or a chart has nothing to show.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/40 p-8 text-center',
        className,
      )}
    >
      {icon && (
        <div className="rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}