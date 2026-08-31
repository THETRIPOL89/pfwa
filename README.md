# PFWA — Personal Finance Manager

A modern, mobile-first PWA for managing personal finances: accounts, transactions, transfers, budgets, investments, AI-generated insights, and market news. Works offline, syncs across devices.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 5 |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS (design tokens via CSS variables) |
| Routing | React Router v6 |
| Server state | TanStack Query v5 (offline-first, IDB persistence ready) |
| UI state | Zustand (theme, sidebar, currency) |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | sonner |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Market data | Yahoo Finance (via Edge Function), CoinGecko (passthrough) |
| News | Google News RSS (server-parsed) |
| AI insights | OpenRouter free models (Llama 3.1 8B) with rule-based fallback |

## Folder structure

```
src/
├─ components/
│  ├─ ui/                  Design-system primitives (Button, Card, Dialog…)
│  ├─ layout/              AppShell, Sidebar, TopBar, BottomNav
│  ├─ charts/              ChartWrapper + individual charts
│  ├─ accounts/            AccountCard, AccountFormDialog
│  ├─ transactions/        TransactionRow, TransactionFormDialog, Filters
│  ├─ investments/         HoldingCard
│  ├─ budgets/             BudgetCard
│  ├─ insights/            InsightCard, InsightsPanel
│  └─ news/                NewsCard
├─ pages/                  One file per route
├─ hooks/                  React Query hooks (useAccounts, useTransactions…)
├─ services/               Pure data access (no React)
├─ stores/                 Zustand stores (theme, ui, sync)
├─ types/                  Domain types (single source of truth)
├─ mocks/                  Realistic italian seed data
└─ lib/                    Utilities, queryClient, supabase client
supabase/
├─ migrations/             Schema, RLS, triggers, seed
└─ functions/              Edge Functions (market, crypto, news, ai)
```

## Local development

```bash
npm install
cp .env.example .env.local        # optional: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                       # http://localhost:5173
```

With `VITE_USE_MOCKS=true` (default in `.env.example`), the app reads from
`src/mocks/*` — no backend needed.

### Production build

```bash
npm run build
npm run preview
```

### Quality

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
```

## Switching to real data (Supabase)

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Create a project on Supabase, copy the URL + anon key.
3. Update `.env.local`:

```
VITE_USE_MOCKS=false
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=/api
```

4. Push the schema:

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

5. Set the OpenRouter key (free): `https://openrouter.ai`

```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-...
```

6. Deploy Edge Functions:

```bash
supabase functions deploy market-quote
supabase functions deploy crypto-quote
supabase functions deploy news-feed
supabase functions deploy ai-insights
```

7. Restart `npm run dev`. The Vite proxy (`/api/*` → local Supabase) is
already configured for local dev.

## API integration guide

### `GET /api/market?symbols=AAPL,VWRL.MI`

Returns a normalized array of quotes (Yahoo Finance via Edge Function).
CORS-safe because the call is server-side.

```json
[
  { "symbol": "AAPL", "priceCents": 2158000, "currency": "USD", "change24hPct": 1.2, "asOf": 1756483200000 }
]
```

Error handling: the Edge Function returns HTTP 502 with `{ "error": "..." }`
when Yahoo is unreachable; the client `useMarketQuotes` hook gracefully
keeps the last cached value and surfaces a stale-data warning.

### `GET /api/crypto?ids=bitcoin,ethereum&vs=eur`

CoinGecko passthrough. No API key needed. Same response shape as
`/api/market`.

### `GET /api/news?category=mercati`

Parses Google News RSS server-side. Categories: `mercati | crypto | economia | aziende | personale | all`.

```json
[
  {
    "id": "n-abc123",
    "title": "BCE: tassi stabili…",
    "source": "Il Sole 24 Ore",
    "url": "https://…",
    "publishedAt": "2026-08-30T10:30:00Z",
    "summary": "…",
    "category": "mercati"
  }
]
```

### `POST /api/ai/insights`

Body:

```json
{
  "userId": "uuid",
  "aggregates": {
    "monthIncomeCents": 280000,
    "monthExpenseCents": 195000,
    "categoryTotals": [{ "categoryId": "cat-rist", "name": "Ristoranti", "amountCents": 21000, "prevAmountCents": 16000 }],
    "budgetStatus": [{ "categoryName": "Ristoranti", "budgetCents": 15000, "spentCents": 21000 }],
    "topPayees": [{ "payee": "Esselunga", "amountCents": 45000 }],
    "holdingAllocation": [{ "assetClass": "stock", "valuePct": 0.55 }, { "assetClass": "crypto", "valuePct": 0.30 }]
  }
}
```

Returns an array of insight objects:

```json
[
  {
    "id": "i-abc123",
    "kind": "spending_pattern",
    "severity": "warning",
    "title": "+30% in Ristoranti",
    "body": "Hai speso il 30% in più in ristoranti rispetto al mese scorso.",
    "iconKey": "UtensilsCrossed",
    "colorToken": "warning",
    "generatedAt": "2026-08-30T10:30:00Z"
  }
]
```

If the LLM fails or `OPENROUTER_API_KEY` is not set, the Edge Function
serves a deterministic rule-based fallback so the UI is never empty.

## Database schema overview

All tables are user-scoped with RLS (`auth.uid() = user_id` policies). Money is always stored as `bigint` cents. Full DDL lives in `supabase/migrations/0001_init.sql`.

Tables: `accounts`, `categories`, `transactions`, `transfers`, `budgets`, `investments`, `dividends`, `insights`, `news_cache`.

Highlights:

- **Money** is always `bigint` cents to avoid float bugs.
- **Transfers** group the two legs via a `transfers` row + `transfer_id` FK on `transactions`.
- **Account balance** is denormalized on `accounts.balance_cents` and kept in sync by an `after insert/update/delete` trigger on `transactions`.
- **`updated_at`** is maintained by a generic `set_updated_at()` trigger.
- **Receipts** go in a private Storage bucket `receipts` with a folder-per-user policy.

## Deploy checklist (Vercel + Supabase)

- [ ] Push schema: `supabase db push`
- [ ] Run seed: `supabase db push` includes `0002_seed.sql`
- [ ] Deploy Edge Functions: see `supabase functions deploy …` above
- [ ] Set secrets: `supabase secrets set OPENROUTER_API_KEY=…`
- [ ] Create private `receipts` bucket in Supabase Storage
- [ ] Add Vercel project from this repo
- [ ] Build command: `npm run build`
- [ ] Output dir: `dist`
- [ ] Env vars in Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_USE_MOCKS=false`
  - `VITE_API_BASE_URL=/api`
- [ ] Add rewrite `/api/:path*` → `https://YOUR-PROJECT.supabase.co/functions/v1/:path*`
- [ ] Optional: enable Vercel Analytics + Speed Insights
- [ ] Verify: sign up, create account, add transaction, check Dashboard charts render live data

## Design system

| Token | Light | Dark |
|---|---|---|
| `--primary` | 230 89% 56% (indigo) | 217 91% 60% (lighter blue) |
| `--success` | 142 71% 38% | 142 60% 45% |
| `--warning` | 38 92% 50% | 38 92% 55% |
| `--destructive` | 0 84% 55% | 0 72% 55% |
| `--info` | 199 89% 45% | 199 89% 55% |
| `--background` | 0 0% 100% | 222 47% 6% |
| `--card` | 0 0% 100% | 222 47% 9% |
| `--radius` | 0.75rem | — |

Numerals in money/percentages use `font-variant-numeric: tabular-nums`.

## PWA

- `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Workbox runtime caches:
  - `/api/*` → `StaleWhileRevalidate`, 1h, 200 entries
  - Supabase REST → `NetworkFirst`, 24h, 200 entries, 5s timeout
  - Static assets → `CacheFirst`, 30 days
- Manifest declares icons (192, 512, maskable) and `theme_color`

## License

MIT — fork it, ship it, contribute back.