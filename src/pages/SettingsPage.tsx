import { Monitor, Moon, Sun, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeStore, type ThemeMode } from '@/stores/useThemeStore';
import { useUiStore } from '@/stores/useUiStore';
import { useAuth, signOut } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function SettingsPage() {
  const { mode, setMode } = useThemeStore();
  const { preferredCurrency, setCurrency } = useUiStore();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalizza l'aspetto e i comportamenti dell'app.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Aspetto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tema</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = opt.value === mode;
                return (
                  <Button
                    key={opt.value}
                    variant={active ? 'default' : 'outline'}
                    onClick={() => setMode(opt.value)}
                  >
                    <Icon className="size-4" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Valuta predefinita</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['EUR', 'USD', 'GBP'] as const).map((c) => {
                const active = preferredCurrency === c;
                return (
                  <Button
                    key={c}
                    variant={active ? 'default' : 'outline'}
                    onClick={() => {
                      setCurrency(c);
                      toast.success(`Valuta predefinita: ${c}`);
                    }}
                  >
                    {c}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Esporta tutti i tuoi dati in formato JSON o cancellali dal
            dispositivo locale.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info('Esportazione pianificata per la v2')}
            >
              Esporta dati (JSON)
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Importazione CSV pianificata per la v2')}
            >
              Importa CSV
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Cancellare tutti i dati locali?')) {
                  localStorage.clear();
                  toast.success('Cache locale svuotata. Ricarica la pagina.');
                }
              }}
            >
              <Trash2 className="size-4" /> Svuota cache locale
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user?.email ?? '—'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await signOut();
                  toast.success('Disconnesso');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Errore di logout');
                }
              }}
            >
              Esci
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}