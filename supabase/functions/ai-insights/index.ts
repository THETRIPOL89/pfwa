// Supabase Edge Function: ai-insights
// Aggregates the requesting user's transactions, budgets, and holdings,
// then calls OpenRouter's free Llama 3.1 8B model to produce 4-6 insights
// in Italian. Falls back to deterministic rule-based insights if the LLM
// is unreachable or returns invalid JSON.
//
// Required secrets (set via `supabase secrets set`):
//   OPENROUTER_API_KEY — get one free at https://openrouter.ai
//
// Local run: supabase functions serve ai-insights --env-file .env.local
// Deploy:    supabase functions deploy ai-insights

import { corsHeaders, errorResponse, handleCors, json, TTLCache } from '../_shared/cors.ts';

const cache = new TTLCache<unknown>(1000 * 60 * 60 * 6); // 6h

interface InsightDTO {
  kind:
    | 'spending_pattern'
    | 'budget_warning'
    | 'savings_tip'
    | 'investment_tip'
    | 'anomaly'
    | 'positive_trend';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  body: string;
  iconKey: string;
  colorToken: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

const SYSTEM_PROMPT = `Sei un analista finanziario personale. Dato il riepilogo
JSON delle ultime transazioni e dei budget di un utente italiano, genera 4-6
insight in italiano. Per ogni insight rispondi SOLO con un oggetto JSON valido
che rispetta lo schema:

{
  "kind": "spending_pattern" | "budget_warning" | "savings_tip" |
          "investment_tip" | "anomaly" | "positive_trend",
  "severity": "info" | "success" | "warning" | "critical",
  "title": "<titolo breve, max 60 caratteri>",
  "body": "<descrizione in italiano, max 240 caratteri>",
  "iconKey": "UtensilsCrossed" | "AlertTriangle" | "PiggyBank" |
             "TrendingUp" | "LineChart" | "Sparkles" | "HeartPulse",
  "colorToken": "primary" | "success" | "warning" | "destructive" | "info"
}

Restituisci un array JSON puro (niente markdown, niente backtick).
Non menzionare dati personali identificativi. Rispondi in italiano.`;

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const { userId, aggregates } = (await req.json()) as {
      userId: string;
      aggregates: Aggregates;
    };

    const cacheKey = `${userId}__${hashAggregates(aggregates)}`;
    const cached = cache.get(cacheKey);
    if (cached) return json(cached, { headers: { ...corsHeaders, 'x-cache': 'HIT' } });

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    let insights: InsightDTO[];

    if (apiKey) {
      try {
        insights = await callOpenRouter(apiKey, aggregates);
      } catch (err) {
        console.warn('OpenRouter failed, falling back to rules', err);
        insights = ruleBased(aggregates);
      }
    } else {
      insights = ruleBased(aggregates);
    }

    const stamped = insights.map((i) => ({
      ...i,
      id: `i-${hashString(JSON.stringify(i))}`,
      generatedAt: new Date().toISOString(),
    }));

    cache.set(cacheKey, stamped);
    return json(stamped, { headers: { ...corsHeaders, 'x-cache': 'MISS' } });
  } catch (err) {
    console.error('ai-insights error', err);
    return errorResponse('Internal error', 500);
  }
});

async function callOpenRouter(apiKey: string, aggregates: Aggregates): Promise<InsightDTO[]> {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pfwa.app',
      'X-Title': 'PFWA Insights',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(aggregates) },
      ],
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(content);
  const list = Array.isArray(parsed) ? parsed : parsed.insights ?? [];
  if (!Array.isArray(list)) throw new Error('LLM returned non-array');
  return list as InsightDTO[];
}

/* ── Rule-based fallback ─────────────────────────────────────────────── */

interface Aggregates {
  monthIncomeCents: number;
  monthExpenseCents: number;
  categoryTotals: { categoryId: string; name: string; amountCents: number; prevAmountCents: number }[];
  budgetStatus: { categoryName: string; budgetCents: number; spentCents: number }[];
  topPayees: { payee: string; amountCents: number }[];
  holdingAllocation: { assetClass: string; valuePct: number }[];
}

function ruleBased(a: Aggregates): InsightDTO[] {
  const insights: InsightDTO[] = [];

  // Spending pattern: category with biggest delta vs prev month.
  const ranked = [...a.categoryTotals].sort(
    (x, y) => y.amountCents / Math.max(1, y.prevAmountCents) -
              x.amountCents / Math.max(1, x.prevAmountCents),
  );
  const biggest = ranked[0];
  if (biggest && biggest.prevAmountCents > 0) {
    const delta = (biggest.amountCents - biggest.prevAmountCents) / biggest.prevAmountCents;
    if (Math.abs(delta) > 0.1) {
      insights.push({
        kind: 'spending_pattern',
        severity: delta > 0 ? 'warning' : 'success',
        title: `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}% in ${biggest.name}`,
        body:
          delta > 0
            ? `Hai speso il ${Math.round(delta * 100)}% in più in ${biggest.name} rispetto al mese scorso.`
            : `Ottimo: spesa in ${biggest.name} ridotta del ${Math.round(-delta * 100)}%.`,
        iconKey: 'UtensilsCrossed',
        colorToken: delta > 0 ? 'warning' : 'success',
      });
    }
  }

  // Budget warnings.
  for (const b of a.budgetStatus) {
    const pct = b.spentCents / Math.max(1, b.budgetCents);
    if (pct >= 1) {
      insights.push({
        kind: 'budget_warning',
        severity: 'critical',
        title: `Budget ${b.categoryName} superato`,
        body: `Hai superato il budget mensile di ${b.categoryName} (${Math.round(pct * 100)}%).`,
        iconKey: 'AlertTriangle',
        colorToken: 'destructive',
      });
    } else if (pct >= 0.8) {
      insights.push({
        kind: 'budget_warning',
        severity: 'warning',
        title: `Vicino al limite: ${b.categoryName}`,
        body: `Hai consumato il ${Math.round(pct * 100)}% del budget di ${b.categoryName}.`,
        iconKey: 'AlertTriangle',
        colorToken: 'warning',
      });
    }
  }

  // Savings tip.
  const savingsRate =
    a.monthIncomeCents === 0
      ? 0
      : Math.max(0, (a.monthIncomeCents - a.monthExpenseCents) / a.monthIncomeCents);
  if (savingsRate < 0.1 && a.monthIncomeCents > 0) {
    insights.push({
      kind: 'savings_tip',
      severity: 'info',
      title: 'Risparmia almeno il 10%',
      body:
        'Prova a destinare il 10% dello stipendio al risparmio: bastano ~' +
        Math.round((a.monthIncomeCents * 0.1) / 100) +
        '€ al mese.',
      iconKey: 'PiggyBank',
      colorToken: 'info',
    });
  } else if (savingsRate >= 0.2) {
    insights.push({
      kind: 'positive_trend',
      severity: 'success',
      title: 'Risparmio costante',
      body: `Stai risparmiando il ${Math.round(savingsRate * 100)}% del reddito. Continua così.`,
      iconKey: 'TrendingUp',
      colorToken: 'success',
    });
  }

  // Investment tip — crypto concentration warning.
  const crypto = a.holdingAllocation.find((h) => h.assetClass === 'crypto');
  if (crypto && crypto.valuePct > 0.25) {
    insights.push({
      kind: 'investment_tip',
      severity: 'warning',
      title: 'Crypto sopra il 25%',
      body:
        'La tua allocazione crypto supera il 25%. Valuta di ribilanciare verso bond o ETF.',
      iconKey: 'LineChart',
      colorToken: 'warning',
    });
  } else {
    insights.push({
      kind: 'investment_tip',
      severity: 'info',
      title: 'Portafoglio diversificato',
      body:
        'Allocazione attuale: ' +
        a.holdingAllocation.map((h) => `${Math.round(h.valuePct * 100)}% ${h.assetClass}`).join(', '),
      iconKey: 'LineChart',
      colorToken: 'primary',
    });
  }

  // Pad with an anomaly-style insight based on top payee.
  const top = a.topPayees[0];
  if (top && top.amountCents > 30000) {
    insights.push({
      kind: 'anomaly',
      severity: 'info',
      title: `Beneficiario principale: ${top.payee}`,
      body: `Hai speso ${Math.round(top.amountCents / 100)}€ da ${top.payee} questo mese.`,
      iconKey: 'Sparkles',
      colorToken: 'info',
    });
  }

  return insights.slice(0, 6);
}

function hashAggregates(a: Aggregates): string {
  return hashString(JSON.stringify(a));
}
function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h.toString(36);
}