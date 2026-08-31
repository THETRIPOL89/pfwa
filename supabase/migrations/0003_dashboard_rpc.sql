-- =============================================================================
-- PFWA — dashboard aggregate RPCs
-- Server-side rollups replace the old client-side mock math. All functions
-- are SECURITY INVOKER so RLS on the underlying tables still applies.
-- =============================================================================

-- ─── Balance timeline ─────────────────────────────────────────────────────────
-- Daily cumulative balance for the requesting user across `p_months` months
-- back from today. The first row is the opening balance (sum of all
-- account opening balances). Subsequent rows add the day's net transactions.
create or replace function public.dashboard_balance_timeline(p_months int default 6)
returns table(date date, balance_cents bigint)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_today    date := current_date;
  v_start    date := date_trunc('month', (v_today - (p_months - 1) * interval '1 month'))::date;
  v_opening  bigint;
  v_cursor   date;
begin
  select coalesce(sum(opening_balance_cents), 0)
    into v_opening
    from public.accounts
   where user_id = auth.uid();

  v_cursor := v_start;
  while v_cursor <= v_today loop
    return query
      with day_delta as (
        select coalesce(sum(case when kind = 'income' then amount_cents
                                  else -amount_cents end), 0)::bigint as delta
          from public.transactions
         where user_id = auth.uid()
           and occurred_at::date = v_cursor
      ),
      running as (
        select v_opening
             + coalesce((select sum(case when t.kind = 'income' then t.amount_cents
                                          else -t.amount_cents end)
                          from public.transactions t
                         where t.user_id = auth.uid()
                           and t.occurred_at::date < v_cursor), 0) as bal
      )
      select v_cursor, running.bal + day_delta.delta
        from running cross join day_delta;
    v_cursor := v_cursor + 1;
  end loop;
end;
$$;

grant execute on function public.dashboard_balance_timeline(int) to authenticated;

-- ─── Category breakdown ───────────────────────────────────────────────────────
-- Sum of expense transactions per category within `[p_from, p_to]`. Categories
-- with no spend are omitted — empty array means nothing was spent.
create or replace function public.dashboard_category_breakdown(
  p_from timestamptz,
  p_to   timestamptz
)
returns table(category_id uuid, amount_cents bigint)
language sql
security invoker
set search_path = public
stable
as $$
  select category_id, sum(amount_cents)::bigint as amount_cents
    from public.transactions
   where user_id = auth.uid()
     and kind = 'expense'
     and occurred_at >= p_from
     and occurred_at <= p_to
   group by category_id;
$$;

grant execute on function public.dashboard_category_breakdown(timestamptz, timestamptz) to authenticated;

-- ─── Monthly totals ───────────────────────────────────────────────────────────
-- Income and expense per month, going back `p_months` months from the current
-- month inclusive.
create or replace function public.dashboard_monthly_totals(p_months int default 6)
returns table(month text, income bigint, expense bigint)
language sql
security invoker
set search_path = public
stable
as $$
  with months as (
    select date_trunc('month', (current_date - (n || ' months')::interval))::date as m_start
      from generate_series(0, p_months - 1) as n
  )
  select to_char(m.m_start, 'YYYY-MM') as month,
         coalesce(sum(case when t.kind = 'income'  then t.amount_cents end), 0)::bigint as income,
         coalesce(sum(case when t.kind = 'expense' then t.amount_cents end), 0)::bigint as expense
    from months m
    left join public.transactions t
      on t.user_id = auth.uid()
     and t.occurred_at >= m.m_start
     and t.occurred_at <  (m.m_start + interval '1 month')
    group by m.m_start
    order by m.m_start;
$$;

grant execute on function public.dashboard_monthly_totals(int) to authenticated;