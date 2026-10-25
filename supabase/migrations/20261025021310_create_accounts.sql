create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete restrict,
  nickname text not null,
  owner_name text not null,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index accounts_provider_id_idx on public.accounts (provider_id);