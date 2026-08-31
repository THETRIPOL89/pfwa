import { useEffect, useState } from 'react';
import { CloudOff, Cloud, Moon, Sun, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/useThemeStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useUiStore } from '@/stores/useUiStore';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';
import { formatDate, timeAgo } from '@/lib/utils';

export function TopBar() {
  const { mode, setMode } = useThemeStore();
  const { online, pendingMutations, lastSyncedAt } = useSyncStore();
  const { setCommandOpen, toggleSidebar } = useUiStore();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const cycleTheme = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(next);
  };
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Sun;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </Button>

      <button
        onClick={() => setCommandOpen(true)}
        className={cn(
          'flex h-9 w-full max-w-md items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted',
        )}
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">
          Cerca conti, transazioni, payee…
        </span>
        <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:flex',
            online
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-warning/30 bg-warning/10 text-warning',
          )}
          title={
            online
              ? lastSyncedAt
                ? `Sincronizzato ${timeAgo(new Date(lastSyncedAt))}`
                : 'Online'
              : 'Offline — le modifiche sono in coda'
          }
        >
          {online ? (
            <Cloud className="size-3.5" />
          ) : (
            <CloudOff className="size-3.5" />
          )}
          {pendingMutations > 0 ? (
            <span>{pendingMutations} in coda</span>
          ) : (
            <span>{online ? 'Sincronizzato' : 'Offline'}</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={`Tema: ${mode}`}
          title={`Tema corrente: ${mode}`}
        >
          <Icon className="size-4" />
        </Button>

        <div className="hidden md:flex">
          <UserMenu />
        </div>
      </div>

      <span className="sr-only">Oggi: {formatDate(new Date(now))}</span>
    </header>
  );
}