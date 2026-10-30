alter table public.transactions
    add column on_hold boolean not null default false,
    add column released_at timestamptz;

-- A hold is only meaningful for cash outs: "either not on hold, or a cash out"
alter table public.transactions
    add constraint trnsactions_on_hold_cash_out_check
    check (not on_hold or type = 'cash_out');

-- While held, nothing is released yet: "either not on hold, or no release time"
alter table public.transactions
    add constraint transactions_hold_not_released_check
    check (not on_hold or released_at is null);

