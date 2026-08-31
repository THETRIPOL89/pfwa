import type { Insight } from '@/types/domain';

/**
 * Pre-rendered insights used when no live AI is available. The Edge
 * Function `ai-insights` produces equivalent JSON; if it fails or the
 * user is offline, the client falls back to these.
 */
export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'i-1',
    kind: 'spending_pattern',
    severity: 'warning',
    title: 'Spesa ristoranti +30%',
    body:
      'Hai speso il 30% in più in ristoranti rispetto allo scorso mese. Considera di fissare un tetto settimanale.',
    iconKey: 'UtensilsCrossed',
    colorToken: 'warning',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'i-2',
    kind: 'budget_warning',
    severity: 'critical',
    title: 'Budget ristoranti superato',
    body:
      'Hai superato il budget mensile di 15€ per i ristoranti con ancora 8 giorni al termine del mese.',
    iconKey: 'AlertTriangle',
    colorToken: 'destructive',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'i-3',
    kind: 'savings_tip',
    severity: 'info',
    title: 'Risparmiare 80€ al mese',
    body:
      'Riducendo di 2 uscite a ristorante al mese potresti accantonare fino a 80€ in più da investire nel portafoglio ETF.',
    iconKey: 'PiggyBank',
    colorToken: 'info',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'i-4',
    kind: 'positive_trend',
    severity: 'success',
    title: 'Risparmio costante',
    body:
      'Stai accantonando il 12% del tuo reddito ogni mese. Sei in linea con l\'obiettivo di lungo periodo.',
    iconKey: 'TrendingUp',
    colorToken: 'success',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'i-5',
    kind: 'investment_tip',
    severity: 'info',
    title: 'Portafoglio diversificato',
    body:
      'La tua allocazione è 65% azionario, 25% crypto, 10% obbligazionario. Valuta di ribilanciare verso più bond per ridurre la volatilità.',
    iconKey: 'LineChart',
    colorToken: 'primary',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'i-6',
    kind: 'anomaly',
    severity: 'warning',
    title: 'Addebito insolito',
    body:
      'È stato rilevato un addebito di 89€ da "Booking.com" superiore alla tua media di spesa per viaggi.',
    iconKey: 'Sparkles',
    colorToken: 'warning',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];