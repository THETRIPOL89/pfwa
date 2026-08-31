# PFWA — Deploy quickstart

The app is wired for **Supabase** (database + auth + edge functions) and **Vercel** (static SPA + rewrite to edge functions). Follow these steps in order.

## 1. One-time Supabase setup

The CLI is already linked to project `crailpvscqtcgcmubanc` (`supabase/.temp/linked-project.json`).

```bash
# Push schema, RLS, triggers, and the dashboard RPCs + receipts bucket.
supabase db push

# Deploy the four edge functions.
supabase functions deploy market-quote
supabase functions deploy crypto-quote
supabase functions deploy news-feed
supabase functions deploy ai-insights

# Required for the AI insights LLM. Get a free key at https://openrouter.ai
supabase secrets set OPENROUTER_API_KEY=sk-or-...
```

## 2. Vercel project

1. Import this repo in Vercel (https://vercel.com/new).
2. **Build command**: `npm run build`
3. **Output directory**: `dist`
4. **Environment variables** (Project settings → Environment Variables):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://crailpvscqtcgcmubanc.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | the anon key from `.env.local` |
   | `VITE_USE_MOCKS` | `false` |
   | `VITE_API_BASE_URL` | `/api` |

5. Deploy. The `vercel.json` in the repo root forwards `/api/*` → Supabase Edge Functions. No further config needed.

## 3. Smoke test the deploy

- `/` → login page (redirects to `/login` if not authenticated).
- Sign up with a real email — Supabase will send a confirmation. For dev, you can disable email confirmation in Supabase dashboard → Authentication → Providers → Email.
- After sign-in, the dashboard loads with **empty** data (your user, your data only — RLS enforced).
- Create an account → add a transaction → the dashboard balance KPI updates.
- `/investments` shows live quotes via `/api/market-quote` (Yahoo) and `/api/crypto-quote` (CoinGecko).
- `/insights` lists cached insights. The "Refresh" button POSTs to `/api/ai-insights`; with `OPENROUTER_API_KEY` set you'll get LLM-generated insights, otherwise the rule-based fallback.

## 4. Local dev (no Vercel needed)

```bash
# Edit .env.local to set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
# (or set VITE_USE_MOCKS=true to use the in-memory mock layer).
npm run dev
```

The Vite dev server proxies `/api/*` to your local Supabase (`http://localhost:54321/functions/v1/...`) — start it with `supabase functions serve` if you want to test the edge functions offline.

## Production checklist

- [ ] `supabase db push` ran cleanly.
- [ ] All four edge functions respond at `https://crailpvscqtcgcmubanc.supabase.co/functions/v1/<name>`.
- [ ] `OPENROUTER_API_KEY` is set.
- [ ] Vercel env vars are set; build succeeded.
- [ ] The `receipts` bucket exists (created by `0004_storage_receipts.sql`).
- [ ] Auth email templates customised in Supabase dashboard (optional, branding).
