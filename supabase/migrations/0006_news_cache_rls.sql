-- =============================================================================
-- news_cache: enable RLS and add public read/write policies.
-- The client (browser) fetches news via rss2json.com, then upserts into this
-- table so subsequent loads are instant. Edge Function egress is blocked by
-- Supabase, so the browser is the only place that can fetch live RSS.
-- =============================================================================

alter table public.news_cache enable row level security;

drop policy if exists "news_cache_read_all" on public.news_cache;
create policy "news_cache_read_all" on public.news_cache
  for select using (true);

drop policy if exists "news_cache_insert_all" on public.news_cache;
create policy "news_cache_insert_all" on public.news_cache
  for insert with check (true);

drop policy if exists "news_cache_update_all" on public.news_cache;
create policy "news_cache_update_all" on public.news_cache
  for update using (true) with check (true);

create index if not exists news_cache_url_idx
  on public.news_cache (url);