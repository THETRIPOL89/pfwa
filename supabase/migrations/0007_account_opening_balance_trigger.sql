-- =============================================================================
-- Recompute balance_cents when opening_balance_cents changes.
-- The existing transactions_balance_sync trigger only fires on transaction
-- inserts/updates/deletes, so editing an account's opening_balance_cents
-- leaves balance_cents stale. This trigger fixes that.
-- =============================================================================

create or replace function public.accounts_opening_balance_trigger()
returns trigger as $$
begin
  -- Only recompute when opening_balance_cents actually changes; otherwise
  -- we're just touching metadata (name, color, archived, …).
  if new.opening_balance_cents is distinct from old.opening_balance_cents then
    perform public.recompute_account_balance(new.id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists accounts_opening_balance_sync on public.accounts;
create trigger accounts_opening_balance_sync
  before update on public.accounts
  for each row execute function public.accounts_opening_balance_trigger();