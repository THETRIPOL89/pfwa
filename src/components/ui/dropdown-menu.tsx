import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Simple dropdown menu. Triggered by a button, items receive onClick and
 * optional destructive flag (renders in red).
 */

type Item = {
  label: React.ReactNode;
  onSelect: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
};

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
}: {
  trigger: React.ReactElement;
  items: Item[];
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          setOpen((o) => !o);
        },
      })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border bg-popover p-1 shadow-elevated animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                item.destructive && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
                item.disabled && 'pointer-events-none opacity-50',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}