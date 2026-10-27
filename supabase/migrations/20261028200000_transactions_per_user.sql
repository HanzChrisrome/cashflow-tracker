-- Transactions are scoped through their account: a user can only see and
-- manage transactions whose account belongs to them. Existing rows need no
-- backfill — visibility flows from the accounts' owner.

-- Remove the policies from 20261028180000 and the original open policy.
drop policy if exists "Users can read their own transactions"
  on public.transactions;

drop policy if exists "Authenticated users have full access"
  on public.transactions;

-- Ownership lives on accounts, so the denormalized column is not needed.
alter table public.transactions
  drop column if exists user_id;

create policy "Users can manage their own account transactions"
  on public.transactions
  for all to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = transactions.account_id
        and a.user_id = auth.uid()
    )
  );
