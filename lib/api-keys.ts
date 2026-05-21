import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const TIER_QUOTAS = {
  free: 1_000,
  pro: 50_000,
  enterprise: 1_000_000,
} as const;

export type Tier = keyof typeof TIER_QUOTAS;

export interface ApiKeyRecord {
  id: string;
  key: string;
  owner_email: string;
  tier: Tier;
  monthly_quota: number;
  monthly_used: number;
  monthly_reset_at: string;
  total_calls: number;
  last_used_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  app_name: string | null;
}

export interface CheckKeyResult {
  ok: boolean;
  reason?: "missing_key" | "invalid_key" | "deactivated" | "quota_exceeded" | "internal";
  record?: ApiKeyRecord;
  remaining?: number;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role not configured");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Generate a fresh API key. Format: glk_<43-char base64url>.
 * 256 bits of entropy. Sufficient for non-auth read-only access control.
 */
export function generateApiKey(): string {
  const bytes = crypto.randomBytes(32);
  const b64 = bytes.toString("base64url");
  return `glk_${b64}`;
}

/**
 * Read the API key from an Authorization header.
 *   Authorization: Bearer glk_xxx     → "glk_xxx"
 *   X-Glurk-Api-Key: glk_xxx          → "glk_xxx"
 *   ?api_key=glk_xxx                  → "glk_xxx"
 */
export function readApiKey(req: Request, url: URL): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const header = req.headers.get("x-glurk-api-key");
  if (header) return header.trim();

  const queryParam = url.searchParams.get("api_key");
  if (queryParam) return queryParam.trim();

  return null;
}

/**
 * Validate an API key and atomically increment its usage. Returns
 * remaining-this-month for the rate-limit headers.
 *
 * Atomicity: Postgres handles the increment; this is safe under
 * concurrent requests. The monthly reset check is idempotent — if
 * two requests see an expired window, both will write the same reset
 * value with monthly_used = 1.
 */
export async function consumeApiKey(rawKey: string): Promise<CheckKeyResult> {
  if (!rawKey || !rawKey.startsWith("glk_")) {
    return { ok: false, reason: "invalid_key" };
  }

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch {
    return { ok: false, reason: "internal" };
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key", rawKey)
    .maybeSingle();

  if (error) {
    console.error("api-keys lookup failed:", error.message);
    return { ok: false, reason: "internal" };
  }
  if (!data) {
    return { ok: false, reason: "invalid_key" };
  }

  const record = data as ApiKeyRecord;
  if (record.deactivated_at) {
    return { ok: false, reason: "deactivated" };
  }

  // Reset the monthly window if needed.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  let monthlyUsed = record.monthly_used;
  let monthlyResetAt = record.monthly_reset_at;
  if (new Date(record.monthly_reset_at) < monthStart) {
    monthlyUsed = 0;
    monthlyResetAt = monthStart.toISOString();
  }

  if (monthlyUsed >= record.monthly_quota) {
    return {
      ok: false,
      reason: "quota_exceeded",
      record,
      remaining: 0,
    };
  }

  const newMonthlyUsed = monthlyUsed + 1;
  const newTotal = (record.total_calls ?? 0) + 1;

  const { error: updateError } = await supabase
    .from("api_keys")
    .update({
      monthly_used: newMonthlyUsed,
      monthly_reset_at: monthlyResetAt,
      total_calls: newTotal,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  if (updateError) {
    console.error("api-keys consume failed:", updateError.message);
    return { ok: false, reason: "internal" };
  }

  return {
    ok: true,
    record: { ...record, monthly_used: newMonthlyUsed, total_calls: newTotal },
    remaining: record.monthly_quota - newMonthlyUsed,
  };
}

/**
 * Provision a new key. Free tier is open self-serve; pro/enterprise
 * are gated by an admin secret for now (until billing is wired in).
 */
export async function provisionApiKey(input: {
  email: string;
  tier: Tier;
  appName?: string;
  adminSecret?: string;
}): Promise<{ ok: true; key: string; tier: Tier } | { ok: false; error: string }> {
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "valid email required" };
  }

  if (input.tier !== "free") {
    const expected = process.env.GLURK_ADMIN_SECRET;
    if (!expected || input.adminSecret !== expected) {
      return {
        ok: false,
        error: "paid tiers require admin provisioning — contact the team",
      };
    }
  }

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch {
    return { ok: false, error: "service not configured" };
  }

  // Limit free-tier signups to 1 active key per email to discourage
  // trivial sybil attacks. Pro/enterprise can have multiple.
  if (input.tier === "free") {
    const { data: existing } = await supabase
      .from("api_keys")
      .select("id")
      .eq("owner_email", input.email.toLowerCase().trim())
      .eq("tier", "free")
      .is("deactivated_at", null)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "this email already has an active free key" };
    }
  }

  const key = generateApiKey();
  const { error } = await supabase.from("api_keys").insert({
    key,
    owner_email: input.email.toLowerCase().trim(),
    tier: input.tier,
    monthly_quota: TIER_QUOTAS[input.tier],
    app_name: input.appName ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, key, tier: input.tier };
}
