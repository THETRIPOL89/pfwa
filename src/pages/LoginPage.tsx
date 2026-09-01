import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { toast } from '@/components/ui/toast';
import { signInWithPassword, signUp, sendMagicLink, useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Mode = 'password' | 'magic';

function humanizeError(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return fallback;
}

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Already signed in? Bounce to the original target.
  useEffect(() => {
    if (!loading && isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, loading, navigate, from]);

  function reset() {
    setInlineError(null);
    setInfo(null);
  }

  async function handleSignIn() {
    reset();
    if (!email || !password) {
      setInlineError('Inserisci email e password');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // signInWithPassword returns a session on success.
      if (!data.session) {
        setInlineError(
          'Accesso non riuscito. Controlla di aver confermato la email (controlla anche la cartella spam).',
        );
        return;
      }
      toast.success('Accesso effettuato');
      navigate(from, { replace: true });
    } catch (e) {
      const msg = humanizeError(e, 'Errore di accesso');
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    reset();
    if (!email || !password) {
      setInlineError('Inserisci email e password');
      return;
    }
    if (password.length < 6) {
      setInlineError('La password deve essere di almeno 6 caratteri');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        // Email confirmation is OFF — the user is already signed in.
        toast.success('Account creato');
        navigate(from, { replace: true });
        return;
      }
      // Confirmation required: surface a friendly message and offer a resend.
      setInfo(
        'Account creato. Ti abbiamo inviato una email di conferma. Clicca il link per attivare l\'account, poi torna qui per accedere.',
      );
      toast.success('Controlla la tua email per confermare la registrazione');
    } catch (e) {
      const msg = humanizeError(e, 'Errore di registrazione');
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagic() {
    reset();
    if (!email) {
      setInlineError('Inserisci la tua email');
      return;
    }
    setBusy(true);
    try {
      await sendMagicLink(email);
      setInfo('Ti abbiamo inviato un magic link. Apri la email e clicca il link per accedere.');
      toast.success('Magic link inviato');
    } catch (e) {
      const msg = humanizeError(e, 'Errore di invio');
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    reset();
    if (!email) {
      setInlineError('Inserisci la tua email per ricevere un nuovo link');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setInfo('Email di conferma reinviata. Controlla la posta (anche lo spam).');
      toast.success('Email di conferma reinviata');
    } catch (e) {
      const msg = humanizeError(e, 'Errore di reinvio');
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (busy) return;
    if (mode === 'password') void handleSignIn();
    else void handleMagic();
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Segmented
              value={mode}
              onChange={(v) => {
                setMode(v as Mode);
                reset();
              }}
              options={[
                { value: 'password', label: 'Email + password' },
                { value: 'magic', label: 'Magic link' },
              ]}
            />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="tu@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            </div>

            {mode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Almeno 6 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                  minLength={6}
                />
              </div>
            )}

            {inlineError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {inlineError}
              </div>
            )}

            {info && (
              <div
                role="status"
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
              >
                <p>{info}</p>
                {info.includes('conferma') && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={busy}
                    className="mt-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
                  >
                    Reinvia email di conferma
                  </button>
                )}
              </div>
            )}

            {mode === 'password' ? (
              <div className="flex flex-col gap-2">
                {/* Hidden submit so Enter in any input triggers sign-in */}
                <button type="submit" hidden />
                <Button type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? 'Accesso…' : 'Accedi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleSignUp} disabled={busy}>
                  {busy ? 'Creazione…' : 'Crea un account'}
                </Button>
              </div>
            ) : (
              <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
                {busy ? 'Invio…' : 'Invia magic link'}
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              I tuoi dati sono salvati in modo sicuro con Supabase.{' '}
              <Link to="/" className="text-primary hover:underline">
                Home
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}