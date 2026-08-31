-- =============================================================================
-- PFWA — schema, RLS, indexes, storage
-- Run with: supabase db push   (after `supabase link`)
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- for exclusion constraints if needed

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type account_type as enum (
  'checking', 'savings', 'credit_card', 'cash', 'crypto_wallet', 'investment'
);
create type category_kind as enum ('expense', 'income', 'both');
create type tx_kind as enum ('expense', 'income');
create type budget_period as enum ('weekly', 'monthly', 'yearly');
create type asset_class as enum ('stock', 'etf', 'bond', 'crypto', 'other');

-- ─── accounts ─────────────────────────────────────────────────────────────────
create table public.accounts (
    id                    uuid primary key default gen_random_uuid(),
    user_id               uuid not null references auth.users(id) on delete cascade,
    name                  text not null,
    type                  account_type not null,
    currency              text not null default 'EUR',
    opening_balance_cents bigint not null default 0,
    balance_cents         bigint not null default 0, -- denormalized, maintained by trigger
    color                 text not null default 'cat-indigo',
    icon                  text not null default 'Wallet',
    institution           text,
    archived              boolean not null default false,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);
create index accounts_user_idx on public.accounts (user_id, archived);

-- ─── categories ───────────────────────────────────────────────────────────────
create table public.categories (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users(id) on delete cascade, -- null for default seed
    parent_id   uuid references public.categories(id) on delete set null,
    name        text not null,
    icon        text not null default 'Wallet',
    color       text not null default 'cat-indigo',
    kind        category_kind not null,
    is_default  boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create unique index categories_unique_name
    on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'), parent_id, name);

-- ─── transactions ─────────────────────────────────────────────────────────────
create table public.transactions (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    account_id          uuid not null references public.accounts(id) on delete cascade,
    category_id         uuid references public.categories(id) on delete set null,
    kind                tx_kind not null,
    amount_cents        bigint not null check (amount_cents > 0),
    currency            text not null default 'EUR',
    occurred_at         timestamptz not null,
    payee               text,
    notes               text,
    tags                text[] not null default '{}',
    recurring_rule      jsonb,
    recurring_parent_id uuid references public.transactions(id) on delete set null,
    receipt_path        text,
    transfer_id         uuid,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index transactions_user_date_idx
    on public.transactions (user_id, occurred_at desc);
create index transactions_account_date_idx
    on public.transactions (account_id, occurred_at desc);
create index transactions_category_idx
    on public.transactions (category_id);
create index transactions_tags_idx
    on public.transactions using gin (tags);

-- ─── transfers (groups the two legs) ──────────────────────────────────────────
create table public.transfers (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    from_account_id uuid not null references public.accounts(id),
    to_account_id   uuid not null references public.accounts(id),
    amount_cents    bigint not null check (amount_cents > 0),
    currency        text not null default 'EUR',
    occurred_at     timestamptz not null,
    notes           text,
    created_at      timestamptz not null default now()
);
alter table public.transactions
    add constraint transactions_transfer_fk
    foreign key (transfer_id) references public.transfers(id) on delete set null;

-- ─── budgets ──────────────────────────────────────────────────────────────────
create table public.budgets (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    period      budget_period not null,
    amount_cents bigint not null check (amount_cents > 0),
    starts_on   date not null,
    ends_on     date,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create unique index budgets_unique
    on public.budgets (user_id, category_id, period, starts_on);

-- ─── investments ──────────────────────────────────────────────────────────────
create table public.investments (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    account_id      uuid not null references public.accounts(id) on delete cascade,
    symbol          text not null,
    name            text not null,
    asset_class     asset_class not null,
    quantity        numeric(20, 8) not null check (quantity >= 0),
    avg_cost_cents  bigint not null check (avg_cost_cents >= 0),
    currency        text not null default 'EUR',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index investments_user_symbol_idx on public.investments (user_id, symbol);

-- ─── dividends ────────────────────────────────────────────────────────────────
create table public.dividends (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    investment_id uuid not null references public.investments(id) on delete cascade,
    amount_cents  bigint not null,
    currency      text not null default 'EUR',
    received_at   date not null,
    created_at    timestamptz not null default now()
);
create index dividends_user_date_idx on public.dividends (user_id, received_at desc);

-- ─── insights (AI cache) ──────────────────────────────────────────────────────
create table public.insights (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    kind         text not null,
    severity     text not null,
    title        text not null,
    body         text not null,
    icon_key     text not null,
    color_token  text not null,
    period_start date not null,
    period_end   date not null,
    generated_at timestamptz not null default now()
);
create index insights_user_period_idx on public.insights (user_id, period_start desc);

-- ─── news_cache (server-side RSS cache, populated by Edge Function) ───────────
create table public.news_cache (
    id           uuid primary key default gen_random_uuid(),
    source       text not null,
    title        text not null,
    url          text not null unique,
    published_at timestamptz not null,
    summary      text,
    category     text,
    fetched_at   timestamptz not null default now()
);
create index news_cache_pub_idx on public.news_cache (published_at desc);

-- ─── updated_at trigger helper ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger investments_updated_at before update on public.investments
  for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ─── account balance recompute ────────────────────────────────────────────────
create or replace function public.recompute_account_balance(p_account uuid)
returns void as $$
begin
  update public.accounts set balance_cents = coalesce((
    select
      opening_balance_cents + sum(
        case when kind = 'income' then amount_cents else -amount_cents end
      )
    from public.transactions
    where account_id = p_account
  ), 0)
  where id = p_account;
end;
$$ language plpgsql;

create or replace function public.transactions_balance_trigger()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_account_balance(old.account_id);
    return old;
  else
    perform public.recompute_account_balance(new.account_id);
    if (tg_op = 'UPDATE' and old.account_id is distinct from new.account_id) then
      perform public.recompute_account_balance(old.account_id);
    end if;
    return new;
  end if;
end;
$$ language plpgsql;

create trigger transactions_balance_sync
  after insert or update or delete on public.transactions
  for each row execute function public.transactions_balance_trigger();

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;
alter table public.budgets enable row level security;
alter table public.investments enable row level security;
alter table public.dividends enable row level security;
alter table public.insights enable row level security;

-- accounts
create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

-- categories: read defaults (user_id is null) + own
create policy "categories_read" on public.categories
  for select using (user_id is null or auth.uid() = user_id);
create policy "categories_write_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- transactions
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- transfers
create policy "transfers_select_own" on public.transfers
  for select using (auth.uid() = user_id);
create policy "transfers_insert_own" on public.transfers
  for insert with check (auth.uid() = user_id);
create policy "transfers_delete_own" on public.transfers
  for delete using (auth.uid() = user_id);

-- budgets
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_write_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- investments
create policy "investments_select_own" on public.investments
  for select using (auth.uid() = user_id);
create policy "investments_write_own" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- dividends
create policy "dividends_select_own" on public.dividends
  for select using (auth.uid() = user_id);
create policy "dividends_write_own" on public.dividends
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- insights
create policy "insights_select_own" on public.insights
  for select using (auth.uid() = user_id);
create policy "insights_write_own" on public.insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Storage: receipts bucket ─────────────────────────────────────────────────
-- Run once via: supabase storage create receipts private
-- Then apply the policy below.
-- create policy "receipts_user_folder" on storage.objects
--   for all using (
--     bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
--   );