import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analisi periodiche delle tue finanze generate da un modello AI
          (OpenRouter · Llama 3.1 8B) con fallback rule-based.
        </p>
      </header>

      <InsightsPanel />

      <Card>
        <CardHeader>
          <CardTitle>Come funziona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Ogni insight è calcolato aggregando le tue transazioni, i budget e
            il portafoglio nel periodo corrente. I dati lasciano il browser
            solo attraverso Edge Functions Supabase, dove vengono anonimizzati
            prima di essere inviati al modello AI.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Spending pattern</strong>: variazioni significative
              rispetto alla media storica.
            </li>
            <li>
              <strong>Budget warning</strong>: avvicinamento o superamento di
              un budget mensile.
            </li>
            <li>
              <strong>Savings tip</strong>: opportunità concrete per
              accantonare denaro.
            </li>
            <li>
              <strong>Investment tip</strong>: ribilanciamento del portafoglio
              sulla base dell'allocazione corrente.
            </li>
            <li>
              <strong>Anomaly</strong>: addebiti insoliti rispetto al tuo
              profilo.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}