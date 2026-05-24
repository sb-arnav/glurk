import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { generateApiKey, TIER_QUOTAS, type Tier } from "@/lib/api-keys";
import { verifyPaddleSignature, type PaddleSubscriptionEvent } from "@/lib/paddle";

export const dynamic = "force-dynamic";
// Vercel/Next 16 default body parser is fine for raw read; we read the
// body as text so the HMAC sees the same bytes Paddle signed.

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Paddle webhook handler.
 *
 * Events we care about (Paddle Billing v4):
 *
 *   subscription.created     — first successful checkout. Provision the
 *                              API key, link customer + subscription
 *                              ids to it, mark the pending checkout as
 *                              completed so the /thanks page can return
 *                              the key to the user.
 *
 *   subscription.updated     — plan change or status change. Re-sync
 *                              the tier on the linked api_key.
 *
 *   subscription.canceled    — cancel/expiry. Downgrade api_key tier
 *                              back to free quota and write a deactivated
 *                              flag if the cancellation is immediate.
 *
 * All other events are ack'd but ignored.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  if (!verifyPaddleSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: PaddleSubscriptionEvent;
  try {
    event = JSON.parse(rawBody) as PaddleSubscriptionEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Acknowledge fast — Paddle treats 2xx as delivered. Don't sit in here
  // doing slow work that could miss their retry window.
  try {
    await handleEvent(event);
  } catch (e) {
    console.error("paddle webhook handler error:", (e as Error).message);
    // Still ack: we'd rather log + investigate than have Paddle retry
    // and produce duplicate keys. Webhook is idempotent on subscription_id
    // anyway, but the safe story is to investigate logs on errors.
  }

  return NextResponse.json({ ok: true });
}

async function handleEvent(event: PaddleSubscriptionEvent) {
  const eventType = event.event_type;
  const data = event.data;
  if (!eventType || !data?.id) return;

  // Map the Paddle plan → Glurk tier. Today there's only one paid price
  // (Pro). When Enterprise self-serve lands, this becomes a real lookup.
  const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ?? "";
  const priceId = data.items?.[0]?.price?.id ?? "";
  // Map price -> tier. When the pro price id is configured, anything that isn't
  // the pro price must NOT receive pro quota (billing-bypass guard). If the env
  // var is unset we can't distinguish, so fall back to the historical 'pro'
  // rather than downgrade a real payer — but log it loudly.
  let tier: Tier;
  if (!proPriceId) {
    console.warn(
      "[paddle webhook] NEXT_PUBLIC_PADDLE_PRO_PRICE_ID not set — defaulting to 'pro'. Set it to enable strict price->tier mapping.",
    );
    tier = "pro";
  } else {
    tier = priceId === proPriceId ? "pro" : "free";
  }

  const supabase = getServiceClient();

  if (eventType === "subscription.created") {
    await provisionFromSubscription(supabase, data, tier);
    return;
  }

  if (eventType === "subscription.updated") {
    await syncSubscriptionStatus(supabase, data);
    return;
  }

  if (eventType === "subscription.canceled") {
    await downgradeSubscription(supabase, data);
    return;
  }

  // transaction.completed and others: ack-only.
}

async function provisionFromSubscription(
  supabase: ReturnType<typeof getServiceClient>,
  data: PaddleSubscriptionEvent["data"],
  tier: Tier,
) {
  const subscriptionId = data.id;
  const customerId = data.customer_id ?? null;
  const transactionId = data.transaction_id ?? null;

  // Idempotency: if we've already provisioned a key for this subscription,
  // just mark the pending checkout completed and return.
  const { data: existing } = await supabase
    .from("api_keys")
    .select("id, key, owner_email")
    .eq("paddle_subscription_id", subscriptionId)
    .maybeSingle();

  if (existing) {
    if (transactionId) {
      await supabase
        .from("paddle_checkouts")
        .update({
          status: "completed",
          api_key_id: existing.id,
          completed_at: new Date().toISOString(),
        })
        .eq("paddle_transaction_id", transactionId);
    }
    return;
  }

  // Resolve email — prefer the pending checkout row (we collected it
  // up-front), fall back to the embedded customer.email.
  let email: string | null = null;
  let appName: string | null = null;
  let checkoutId: string | null = null;
  if (transactionId) {
    const { data: checkout } = await supabase
      .from("paddle_checkouts")
      .select("id, email, app_name")
      .eq("paddle_transaction_id", transactionId)
      .maybeSingle();
    if (checkout) {
      email = checkout.email;
      appName = checkout.app_name;
      checkoutId = checkout.id;
    }
  }
  if (!email && data.customer?.email) email = data.customer.email;
  if (!email) {
    console.error(
      `paddle webhook: no email for subscription ${subscriptionId} — cannot provision key`,
    );
    return;
  }

  const newKey = generateApiKey();
  const { data: inserted, error } = await supabase
    .from("api_keys")
    .insert({
      key: newKey,
      owner_email: email.toLowerCase().trim(),
      tier,
      monthly_quota: TIER_QUOTAS[tier],
      app_name: appName,
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
      paddle_status: data.status ?? "active",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("paddle webhook: api_keys insert failed:", error?.message);
    return;
  }

  if (checkoutId) {
    await supabase
      .from("paddle_checkouts")
      .update({
        status: "completed",
        api_key_id: inserted.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checkoutId);
  }
}

async function syncSubscriptionStatus(
  supabase: ReturnType<typeof getServiceClient>,
  data: PaddleSubscriptionEvent["data"],
) {
  const subscriptionId = data.id;
  await supabase
    .from("api_keys")
    .update({
      paddle_status: data.status ?? "unknown",
    })
    .eq("paddle_subscription_id", subscriptionId);
}

async function downgradeSubscription(
  supabase: ReturnType<typeof getServiceClient>,
  data: PaddleSubscriptionEvent["data"],
) {
  const subscriptionId = data.id;
  // Don't delete — preserve the row for reactivation. Drop tier to free
  // quota and set deactivated_at so the consume path returns 401.
  await supabase
    .from("api_keys")
    .update({
      tier: "free",
      monthly_quota: TIER_QUOTAS.free,
      paddle_status: data.status ?? "canceled",
      deactivated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscriptionId);
}
