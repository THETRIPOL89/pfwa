import { useState } from 'react';
import { LogOut, KeyRound, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth, signOut, updatePassword } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

/**
 * Avatar + dropdown that surfaces the real signed-in user and the
 * sign-out / change-password actions. Replaces the hardcoded "MR"
 * initials in TopBar and the static text in SettingsPage.
 */
export function UserMenu({ className }: { className?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const email = user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '··';

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('Disconnesso');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore di logout');
    } finally {
      setOpen(false);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      toast.error('Password troppo corta (min 6 caratteri)');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password aggiornata');
      setPwOpen(false);
      setNewPassword('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore aggiornamento password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        title={email || 'Utente'}
        aria-label="Menu utente"
      >
        {initials}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center gap-3 border-b p-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {user?.user_metadata?.full_name ?? 'Utente'}
                </div>
                <div className="truncate text-xs text-muted-foreground">{email}</div>
              </div>
            </div>
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  setPwOpen(true);
                }}
              >
                <KeyRound className="size-4" /> Cambia password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setOpen(false)}
                asChild
              >
                <a href="/settings" className="flex items-center gap-2">
                  <UserIcon className="size-4" /> Impostazioni
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" /> Esci
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>Cambia password</DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-password">Nuova password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Almeno 6 caratteri"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={busy}>
              Annulla
            </Button>
            <Button onClick={handleUpdatePassword} disabled={busy}>
              {busy ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}