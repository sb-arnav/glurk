import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Best-effort client IP, hashed so raw IPs are never stored.
 * Vercel sets x-forwarded-for / x-real-ip; the left-most XFF entry is the client.
 */
export function clientIpHash(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = xff || req.headers.get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Fixed-window limiter backed by the Supabase `rate_limit_hit` RPC (see
 * supabase/migrations/20261007120000_rate_limits.sql). Returns true when the
 * request is allowed. Fails OPEN if the store is unreachable or the migration
 * is not applied yet, so an infra problem never takes the API down.
 */
export async function rateLimit(
  bucket: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_bucket: bucket,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) {
      console.error("rate-limit rpc failed:", error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error("rate-limit error:", e);
    return true;
  }
}
