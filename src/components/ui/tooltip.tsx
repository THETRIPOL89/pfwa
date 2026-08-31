import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * CSS-only tooltip. Wrap the trigger in <Tooltip content="...">...</Tooltip>.
 */
export function Tooltip({
  content,
  children,
  className,
  side = 'top',
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}) {
  const [open, setOpen] = React.useState(false);
  const position =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : 'top-full left-1/2 -translate-x-1/2 mt-2';
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 max-w-xs rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow',
            position,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}