-- Sample data for local development only. All names and amounts are fake.

insert into public.providers (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'GCash'),
  ('22222222-2222-2222-2222-222222222222', 'Maya');

insert into public.accounts (id, provider_id, nickname, owner_name, monthly_limit, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'GCash 1', 'Sample Owner A', 100000.00, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'GCash 2', 'Sample Owner B', 100000.00, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Maya 1', 'Sample Owner A', 50000.00, true),
  ('aaaaaaaa-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Maya 2 (inactive)', 'Sample Owner C', 50000.00, false);

insert into public.transactions (account_id, type, amount, fee, note, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cash_in',  1000.00, 10.00, 'Sample cash in',  'active'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cash_out',  500.00, 10.00, 'Sample cash out', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'cash_in',  2500.00, 25.00, null,              'active'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'cash_out', 1500.00, 15.00, 'Sample cash out', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'cash_in',   300.00,  5.00, 'Entered by mistake', 'void');