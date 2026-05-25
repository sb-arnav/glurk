import crypto from "crypto";

/**
 * Constant-time string comparison for secrets (admin tokens, API keys).
 *
 * A plain `a !== b` short-circuits on the first differing byte, leaking the
 * length of the matching prefix through response timing. We hash both sides to
 * fixed-length SHA-256 digests first, then compare with timingSafeEqual — this
 * both removes the early-exit and sidesteps timingSafeEqual's own throw on
 * length-mismatched buffers.
 */
export function secureCompare(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}
