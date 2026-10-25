create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete restrict,
  type text not null check (type in ('cash_in', 'cash_out')),
  amount numeric(12, 2) not null check (amount > 0),
  fee numeric(12, 2) not null default 0 check (fee >= 0),
  note text,
  status text not null default 'active' check (status in ('active', 'void')),
  created_at timestamptz not null default now()
);

create index transactions_account_id_created_at_idx
  on public.transactions (account_id, created_at desc);