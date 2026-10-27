alter table public.transactions
  add column occurred_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
