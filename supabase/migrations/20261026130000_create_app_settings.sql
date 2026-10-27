create table public.app_settings (
  id boolean primary key default true check (id),
  warning_threshold integer not null default 80 check (warning_threshold between 1 and 100),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Authenticated users can read app settings"
  on public.app_settings
  for select to authenticated
  using (true);

create policy "Authenticated users can update app settings"
  on public.app_settings
  for update to authenticated
  using (true) with check (true);

insert into public.app_settings (id, warning_threshold) values (true, 80);
