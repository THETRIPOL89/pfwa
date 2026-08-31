import { supabase, USE_MOCKS, requireUserId, API_BASE_URL } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { Insight, InsightKind, InsightSeverity } from '@/types/domain';

type InsightRow = {
  id: string;
  user_id: string;
  kind: string;
  severity: string;
  title: string;
  body: string;
  icon_key: string;
  color_token: string;
  period_start: string;
  period_end: string;
  generated_at: string;
};

function rowToInsight(r: InsightRow): Insight {
  return {
    id: r.id,
    kind: r.kind as InsightKind,
    severity: r.severity as InsightSeverity,
    title: r.title,
    body: r.body,
    iconKey: r.icon_key,
    colorToken: r.color_token as Insight['colorToken'],
    generatedAt: r.generated_at,
  };
}

export async function listInsights(): Promise<Insight[]> {
  if (USE_MOCKS) {
    await networkDelay(220);
    return [...db.insights].sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  }
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToInsight);
}

export async function refreshInsights(): Promise<Insight[]> {
  if (USE_MOCKS) {
    await networkDelay(1500);
    db.insights = db.insights.map((i) => ({
      ...i,
      generatedAt: new Date().toISOString(),
    }));
    return listInsights();
  }
  // POST to the edge function which writes new rows back into the table.
  const userId = await requireUserId();
  const resp = await fetch(`${API_BASE_URL}/ai-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!resp.ok) {
    throw new Error(`Refresh failed: ${resp.status}`);
  }
  return listInsights();
}