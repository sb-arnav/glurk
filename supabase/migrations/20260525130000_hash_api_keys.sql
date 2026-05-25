-- Hash API keys at rest (phase A: additive).
--
-- Plaintext glk_ keys were stored in api_keys.key (behind RLS, but still
-- plaintext). Move lookups to a SHA-256 hash and deliver the plaintext to the
-- buyer transiently via paddle_checkouts.pending_key (shown once on /thanks).
-- This migration is additive and KEEPS api_keys.key populated so the currently
-- deployed code keeps working; a follow-up migration drops the plaintext column
-- after the hash-aware code ships.

-- Hashed lookup column + a non-secret preview for the owner UI.
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS key_hash TEXT,
  ADD COLUMN IF NOT EXISTS key_preview TEXT;

-- Backfill from existing plaintext. The hex digest MUST match Node's
-- crypto.createHash('sha256').update(key).digest('hex') used at runtime.
UPDATE public.api_keys
SET key_hash = encode(extensions.digest(key, 'sha256'), 'hex'),
    key_preview = left(key, 8) || '…' || right(key, 4)
WHERE key IS NOT NULL AND key_hash IS NULL;

-- New rows store the hash only, never plaintext.
ALTER TABLE public.api_keys ALTER COLUMN key DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_hash_idx ON public.api_keys (key_hash);

-- Transient one-time plaintext delivery to the /thanks page after checkout.
ALTER TABLE public.paddle_checkouts
  ADD COLUMN IF NOT EXISTS pending_key TEXT,
  ADD COLUMN IF NOT EXISTS pending_key_expires_at TIMESTAMPTZ;
