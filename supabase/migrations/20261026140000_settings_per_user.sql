-- Switch app_settings from a single global row to one row per user.
drop table if exists public.app_settings;

create table public.app_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  warning_threshold integer not null default 80 check (warning_threshold between 1 and 100),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Users can read their own settings"
  on public.app_settings
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.app_settings
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.app_settings
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Give every new user a settings row with the default threshold.
create or replace function public.handle_new_user_settings()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.app_settings (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_settings();
