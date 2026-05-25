-- Hash API keys at rest (phase B): drop the now-unused plaintext column.
--
-- The hash-aware code is deployed and verified: consumeApiKey + keys/info look up
-- by key_hash, provisioning + the Paddle webhook write hash+preview only, and the
-- buyer's one-time plaintext is delivered via paddle_checkouts.pending_key.
-- Nothing reads api_keys.key anymore, so the plaintext column (and its dependent
-- indexes api_keys_key_key / api_keys_key_active_idx) can go.
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS key;
