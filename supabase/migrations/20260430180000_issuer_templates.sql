-- Per-issuer credential templates (catalog).
--
-- The chain is the source of truth for whether a credential exists. This
-- table is just the "menu" each issuer offers — think Stripe Products,
-- not Stripe Charges. Off-chain because (a) Glurk users browse before
-- minting, (b) the chain has no instruction for "list what slugs an
-- issuer offers," (c) catalogs change frequently and each on-chain edit
-- costs rent.

create table if not exists public.issuer_credential_templates (
  id uuid primary key default gen_random_uuid(),
  issuer_authority text not null, -- base58 pubkey
  slug text not null,             -- canonical credential slug
  name text not null,             -- human-readable name
  description text,
  default_tier text not null check (default_tier in ('platinum','gold','silver','bronze')),
  default_score smallint not null check (default_score between 0 and 100),
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issuer_authority, slug)
);

create index if not exists issuer_templates_authority_idx
  on public.issuer_credential_templates (issuer_authority, display_order);

create index if not exists issuer_templates_active_idx
  on public.issuer_credential_templates (active)
  where active is true;

alter table public.issuer_credential_templates enable row level security;
-- service-role only for writes; reads happen through the API which uses
-- the service role anyway.

comment on table public.issuer_credential_templates is
  'Off-chain catalog of credential types each issuer offers. Chain remains the source of truth for actual credential existence; this table is the "menu."';
