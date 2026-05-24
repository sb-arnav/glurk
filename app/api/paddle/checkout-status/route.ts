import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/paddle/checkout-status?txn=<transaction_id>
 *
 * /thanks polls this until the webhook has provisioned the API key for
 * the given Paddle transaction. Returns the key on success.
 *
 * Designed to be called every 2–3s for up to ~60s. The key is shown
 * exactly once, so the front-end is responsible for storing/displaying
 * it for the user.
 */
export async function GET(req: NextRequest) {
  const txn = req.nextUrl.searchParams.get("txn");
  if (!txn) {
    return NextResponse.json({ error: "txn param required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: checkout, error } = await supabase
    .from("paddle_checkouts")
    .select("status, api_key_id, email, tier, completed_at")
    .eq("paddle_transaction_id", txn)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!checkout) {
    return NextResponse.json({ status: "unknown" });
  }

  if (checkout.status !== "completed" || !checkout.api_key_id) {
    return NextResponse.json({
      status: checkout.status,
      email: checkout.email,
      tier: checkout.tier,
    });
  }

  // The plaintext key is only returned for a short window after provisioning.
  // The /thanks page polls within seconds of checkout, so a legitimate buyer is
  // always inside it. This bounds exposure: a Paddle transaction id can leak via
  // browser history / referrer headers, and previously ANY holder of the txn id
  // could fetch the key indefinitely. Outside the window we withhold the key and
  // the page falls through to its "contact support" state.
  const KEY_RETRIEVAL_WINDOW_MS = 15 * 60 * 1000;
  const completedAtMs = checkout.completed_at
    ? new Date(checkout.completed_at).getTime()
    : 0;
  if (!completedAtMs || Date.now() - completedAtMs > KEY_RETRIEVAL_WINDOW_MS) {
    return NextResponse.json({
      status: "completed",
      email: checkout.email,
      tier: checkout.tier,
    });
  }

  const { data: apiKey, error: keyError } = await supabase
    .from("api_keys")
    .select("key, tier, monthly_quota")
    .eq("id", checkout.api_key_id)
    .maybeSingle();

  if (keyError || !apiKey) {
    return NextResponse.json({ status: "completed" });
  }

  return NextResponse.json({
    status: "completed",
    email: checkout.email,
    tier: apiKey.tier,
    monthlyQuota: apiKey.monthly_quota,
    key: apiKey.key,
  });
}
