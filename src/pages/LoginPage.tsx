import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { toast } from '@/components/ui/toast';
import { signInWithPassword, signUp, sendMagicLink, useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

type Mode = 'password' | 'magic';

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? Bounce to the original target.
  useEffect(() => {
    if (!loading && isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, loading, navigate, from]);

  async function handlePassword() {
    if (!email || !password) {
      toast.error('Inserisci email e password');
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email, password);
      toast.success('Accesso effettuato');
      navigate(from, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore di accesso';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      toast.error('Inserisci email e password');
      return;
    }
    if (password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }
    setBusy(true);
    try {
      await signUp(email, password);
      toast.success('Controlla la tua email per confermare la registrazione');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore di registrazione';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagic() {
    if (!email) {
      toast.error('Inserisci la tua email');
      return;
    }
    setBusy(true);
    try {
      await sendMagicLink(email);
      toast.success('Ti abbiamo inviato un magic link. Controlla la posta.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore di invio';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-primary-foreground">
            <span className="text-base font-bold">P</span>
          </div>
          <CardTitle className="text-xl">Benvenuto in PFWA</CardTitle>
          <CardDescription>
            Gestione finanza personale — conti, transazioni, investimenti e insights AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: 'password', label: 'Email + password' },
              { value: 'magic', label: 'Magic link' },
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={busy ? 'off' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'password' ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handlePassword} disabled={busy}>
                {busy ? 'Accesso…' : 'Accedi'}
              </Button>
              <Button variant="outline" onClick={handleSignUp} disabled={busy}>
                Crea un account
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleMagic} disabled={busy}>
              {busy ? 'Invio…' : 'Invia magic link'}
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            I tuoi dati sono salvati in modo sicuro con Supabase.{' '}
            <Link to="/" className="text-primary hover:underline">
              Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}