/**
 * Shared CORS + JSON helpers used by every Edge Function.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
}

export function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, 'content-type': 'application/json', ...init.headers },
  });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, { status });
}

/** Minimal in-memory cache with TTL — used to avoid hammering upstream APIs. */
export class TTLCache<V> {
  private map = new Map<string, { value: V; expiresAt: number }>();
  constructor(private ttlMs: number) {}
  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key: string, value: V) {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}