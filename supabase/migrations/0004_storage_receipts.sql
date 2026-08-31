-- =============================================================================
-- PFWA — private receipts bucket
-- The `transactions.receipt_path` column already references this bucket.
-- The RLS policy scopes each user to their own folder (`receipts/<uid>/...`).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_user_folder" on storage.objects;
create policy "receipts_user_folder"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );