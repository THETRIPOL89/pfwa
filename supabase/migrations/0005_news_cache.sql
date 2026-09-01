-- =============================================================================
-- news_cache: index + read access for the news-feed Edge Function.
-- The function uses the service_role key, so RLS bypass is automatic; this
-- migration just adds an index that makes the category-filtered read cheap.
-- =============================================================================

create index if not exists news_cache_category_idx
  on public.news_cache (category, published_at desc);