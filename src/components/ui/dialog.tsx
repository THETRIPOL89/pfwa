import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Minimal dialog with focus trap and Escape support — no external Radix
 * dependency. Use for modals and sheets. The same primitive powers both
 * centered modals and side drawers via the `variant` prop.
 */

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const ctx = React.useMemo(
    () => ({ open, setOpen: onOpenChange, titleId }),
    [open, onOpenChange, titleId],
  );
  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>;
}

export function DialogContent({
  children,
  className,
  variant = 'modal',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'modal' | 'sheet-right' | 'sheet-bottom';
}) {
  const ctx = React.useContext(DialogContext);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ctx?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx.setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    innerRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [ctx]);

  if (!ctx?.open) return null;

  const base =
    'fixed z-50 bg-card border shadow-elevated outline-none animate-fade-in';
  const variantClasses =
    variant === 'modal'
      ? 'inset-0 m-auto max-w-lg w-[calc(100%-2rem)] max-h-[85vh] rounded-xl p-6 overflow-auto'
      : variant === 'sheet-right'
        ? 'right-0 top-0 h-full w-full sm:w-[420px] p-6 overflow-auto'
        : 'left-0 right-0 bottom-0 max-h-[90vh] rounded-t-2xl p-6 overflow-auto sm:hidden';

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        ref={innerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ctx.titleId}
        className={cn(base, variantClasses, className)}
      >
        {children}
        <button
          aria-label="Chiudi"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => ctx.setOpen(false)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DialogContext);
  return (
    <div className={cn('mb-4 flex flex-col gap-1.5 pr-8', className)}>
      <h2 id={ctx?.titleId} className="text-lg font-semibold leading-none tracking-tight">
        {children}
      </h2>
    </div>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2',
        className,
      )}
    >
      {children}
    </div>
  );
}