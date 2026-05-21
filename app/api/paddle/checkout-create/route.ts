import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createPaddleCheckout } from "@/lib/paddle";

export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * POST /api/paddle/checkout-create
 *
 * Body: { email, tier?, appName? }
 *
 * Creates a Paddle transaction in `ready` state with the user's email
 * pre-filled. Records a pending row in paddle_checkouts so the /thanks
 * page can poll for the resulting API key once the webhook lands.
 *
 * Returns: { ok, checkoutUrl, transactionId }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const input = body as { email?: string; tier?: string; appName?: string };
  const email = input.email?.trim().toLowerCase();
  const tier = (input.tier ?? "pro") as "pro" | "enterprise";
  const appName = input.appName?.trim() ?? null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (tier !== "pro" && tier !== "enterprise") {
    return NextResponse.json({ error: "tier must be pro or enterprise" }, { status: 400 });
  }
  if (tier === "enterprise") {
    return NextResponse.json(
      { error: "enterprise is contact-sales only — see /pricing" },
      { status: 400 },
    );
  }

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Paddle price not configured server-side" },
      { status: 503 },
    );
  }

  const origin = req.nextUrl.origin;
  const successUrl = `${origin}/thanks?paddle_txn={transaction_id}`;

  const checkout = await createPaddleCheckout({
    priceId,
    email,
    successUrl,
  });

  if (!checkout.ok) {
    return NextResponse.json({ error: checkout.error }, { status: 502 });
  }

  // Record the pending checkout. The webhook joins on transaction_id.
  try {
    const supabase = getServiceClient();
    await supabase.from("paddle_checkouts").insert({
      paddle_transaction_id: checkout.transactionId,
      email,
      tier,
      app_name: appName,
      status: "pending",
    });
  } catch (e) {
    // Non-fatal: the user can still complete checkout. The webhook will
    // fall back to the embedded customer.email when no checkout row
    // exists. Log so we can investigate.
    console.error("paddle_checkouts insert failed:", (e as Error).message);
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: checkout.checkoutUrl,
    transactionId: checkout.transactionId,
  });
}
