-- Link Paddle subscriptions to api_keys so the webhook can upgrade/downgrade
-- the right key when subscription state changes. One Paddle subscription =
-- one Glurk API key (1:1 for now; multi-key per subscription is v2).

alter table public.api_keys
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists paddle_status text;

create index if not exists api_keys_paddle_subscription_idx
  on public.api_keys (paddle_subscription_id)
  where paddle_subscription_id is not null;

create index if not exists api_keys_paddle_customer_idx
  on public.api_keys (paddle_customer_id)
  where paddle_customer_id is not null;

-- Pending checkouts: a row created when the user starts a Paddle checkout
-- so the /thanks page can poll for completion. Webhook fills in api_key_id
-- once the subscription lands.
create table if not exists public.paddle_checkouts (
  id uuid primary key default gen_random_uuid(),
  -- The Paddle transaction id (txn_*) returned when we create the checkout
  paddle_transaction_id text not null unique,
  email text not null,
  tier text not null check (tier in ('pro', 'enterprise')),
  app_name text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'failed')),
  api_key_id uuid references public.api_keys (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists paddle_checkouts_txn_idx
  on public.paddle_checkouts (paddle_transaction_id);

create index if not exists paddle_checkouts_status_idx
  on public.paddle_checkouts (status, created_at desc);

alter table public.paddle_checkouts enable row level security;
-- service-role only — no public policies
