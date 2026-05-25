-- Lock down identity_links (email <-> wallet PII; deanonymizes every user).
--
-- This table was created outside version control, so its live RLS state is
-- unknown. If it was created without RLS (Supabase grants anon/authenticated on
-- public tables by default), anyone holding NEXT_PUBLIC_SUPABASE_ANON_KEY (which
-- ships in the JS bundle) could select * the whole table directly against the
-- Supabase REST endpoint and map every email to its wallet.
--
-- Every reader (auth/me, lookup, v1/check) and writer (issue-credential,
-- solana-credential, github-credential, link-wallet) uses the service-role key,
-- which BYPASSES RLS, so no legitimate access changes. Idempotent (IF EXISTS +
-- enabling already-enabled RLS is a no-op).

ALTER TABLE IF EXISTS public.identity_links ENABLE ROW LEVEL SECURITY;

-- The live table also carried a permissive SELECT policy created out-of-band (not
-- in any migration): `public_lookup` (cmd=SELECT, role=public, USING true). With
-- RLS enabled that policy STILL let anyone with the anon key read the entire
-- email<->wallet table — full deanonymization. The app reads identity_links via
-- the service-role key (bypasses RLS), so this anon SELECT path is removed. The
-- remaining own_link_insert / own_link_update policies are scoped to the caller's
-- own email and are left intact. (Applied to prod 2026-05-25.)
DROP POLICY IF EXISTS public_lookup ON public.identity_links;
