-- Lock down identity_links (email <-> wallet PII; deanonymizes every user).
--
-- This table was created outside version control, so its live RLS state is
-- unknown. If it was created without RLS (Supabase grants anon/authenticated on
-- public tables by default), anyone holding NEXT_PUBLIC_SUPABASE_ANON_KEY (which
-- ships in the JS bundle) could select * the whole table directly against the
-- Supabase REST endpoint and map every email to its wallet.
--
-- Enabling RLS with no policy makes the table deny-all to anon/authenticated.
-- Every reader (auth/me, lookup, v1/check) and writer (issue-credential,
-- solana-credential, github-credential, link-wallet) uses the service-role key,
-- which BYPASSES RLS, so no legitimate access changes. Idempotent (IF EXISTS +
-- enabling already-enabled RLS is a no-op).

ALTER TABLE IF EXISTS public.identity_links ENABLE ROW LEVEL SECURITY;
