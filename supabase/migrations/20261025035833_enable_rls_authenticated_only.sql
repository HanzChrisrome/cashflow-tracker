alter table public.providers enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

create policy "Authenticated users have full access"
  on public.providers
  for all to authenticated
  using (true) with check (true);

create policy "Authenticated users have full access"
  on public.accounts
  for all to authenticated
  using (true) with check (true);

create policy "Authenticated users have full access"
  on public.transactions
  for all to authenticated
  using (true) with check (true);