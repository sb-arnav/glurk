-- Glurk hosted-API monetization: API keys + per-key monthly quotas.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- The chain stays free. This table only gates the hosted convenience
-- endpoint at /api/v1/check for high-volume callers. Anyone can still
-- read program accounts directly via Solana RPC at no cost.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  -- 32-byte random key, prefixed with `glk_` for visual distinction.
  -- Stored as plain text (not hashed) because:
  --   1. We need to display the key to the owner exactly once at create time
  --   2. Lookups happen on every API call — bcrypt would dominate latency
  --   3. The blast radius of leak is rate-limit bypass, not auth
  --      compromise — the key only reads public chain data
  -- If/when this scales to >10k keys, switch to hashed lookup with a
  -- last-4 displayed for owner reference.
  key text not null unique,

  owner_email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),

  -- Quotas reset on the 1st of each month (UTC). monthly_used is the
  -- counter; monthly_reset_at marks when we last reset.
  monthly_quota integer not null default 1000,
  monthly_used integer not null default 0,
  monthly_reset_at timestamptz not null default date_trunc('month', now()),

  -- Lifecycle
  total_calls bigint not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  deactivated_at timestamptz,

  -- Optional metadata for support / analytics
  app_name text,
  notes text
);

create index if not exists api_keys_key_active_idx
  on public.api_keys (key)
  where deactivated_at is null;

create index if not exists api_keys_owner_email_idx
  on public.api_keys (owner_email);

-- RLS: only the service role should read/write this table. The hosted
-- API checks keys with the service role key. End users never query
-- this table directly from the client.
alter table public.api_keys enable row level security;

-- No public policies → effectively service-role-only.

comment on table public.api_keys is
  'Glurk hosted API keys. Read-only access to /api/v1/* endpoints with monthly quotas. The decentralized chain remains free regardless.';
