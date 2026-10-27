-- Accounts become per-user: each store owner only sees and manages their own.
alter table public.accounts
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.accounts
  alter column user_id set default auth.uid();

-- Backfill: hand all existing accounts to the earliest user (the original owner).
update public.accounts
  set user_id = (select id from auth.users order by created_at limit 1)
  where user_id is null;

drop policy if exists "Authenticated users have full access"
  on public.accounts;

create policy "Users can read their own accounts"
  on public.accounts
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
