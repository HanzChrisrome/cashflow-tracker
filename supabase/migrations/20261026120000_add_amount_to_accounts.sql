alter table public.accounts
  add column amount numeric(12, 2) not null default 0 check (amount >= 0);
