import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Lightweight Select built on a native <button> + popover. Not a full ARIA
 * combobox implementation (we don't need typeahead here), but it is
 * keyboard-friendly (Enter/Space toggles, Escape closes, arrows move).
 */

type Option = { value: string; label: string };

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleziona…',
  className,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  );
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(options.length - 1, i + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      }
      if (e.key === 'Enter' && open) {
        e.preventDefault();
        const opt = options[activeIdx];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, options, activeIdx, onChange]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !current && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-elevated animate-fade-in"
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm',
                activeIdx === i && 'bg-accent text-accent-foreground',
                opt.value === value && 'font-medium',
              )}
            >
              {opt.label}
              {opt.value === value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}