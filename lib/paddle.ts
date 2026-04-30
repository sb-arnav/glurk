import crypto from "crypto";

const PADDLE_API_BASE_PRODUCTION = "https://api.paddle.com";
const PADDLE_API_BASE_SANDBOX = "https://sandbox-api.paddle.com";

function paddleApiBase(): string {
  return process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? PADDLE_API_BASE_SANDBOX
    : PADDLE_API_BASE_PRODUCTION;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} not set`);
  return value;
}

/**
 * Verify a Paddle webhook signature.
 *
 * Paddle Billing sends a `Paddle-Signature` header of the form:
 *   ts=<unix_seconds>;h1=<sha256_hex>
 *
 * The HMAC is computed over `<ts>:<raw_body>` using the webhook secret.
 * Returns true only when the signature is valid AND the timestamp is
 * within 5 minutes (to block replay attacks).
 */
export function verifyPaddleSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) return false;

  // Reject anything older than 5 minutes (replay protection).
  const ageSeconds = Math.abs(Date.now() / 1000 - tsNumber);
  if (ageSeconds > 300) return false;

  const secret = requireEnv("PADDLE_WEBHOOK_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  // Constant-time compare to block timing attacks.
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

interface CreateTransactionInput {
  priceId: string;
  email: string;
  successUrl: string;
}

interface CreateTransactionResult {
  ok: true;
  transactionId: string;
  checkoutUrl: string;
}

interface CreateTransactionError {
  ok: false;
  error: string;
}

/**
 * Create a Paddle transaction in a state that produces a hosted checkout
 * URL the user can visit. Customer email is set up-front so the webhook
 * later knows which email to provision the API key for.
 *
 * Paddle transaction lifecycle:
 *   draft → ready (we get a checkout URL here) → completed (webhook fires)
 *
 * Reference: https://developer.paddle.com/api-reference/transactions/create-transaction
 */
export async function createPaddleCheckout(
  input: CreateTransactionInput,
): Promise<CreateTransactionResult | CreateTransactionError> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return { ok: false, error: "PADDLE_API_KEY not set" };

  const body = {
    items: [{ price_id: input.priceId, quantity: 1 }],
    customer: { email: input.email },
    collection_mode: "automatic" as const,
    checkout: {
      url: input.successUrl,
    },
  };

  const res = await fetch(`${paddleApiBase()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    data?: { id: string; checkout?: { url?: string } };
    error?: { detail?: string; type?: string };
  };

  if (!res.ok || !data.data) {
    return {
      ok: false,
      error: data.error?.detail ?? `paddle returned ${res.status}`,
    };
  }

  if (!data.data.checkout?.url) {
    return {
      ok: false,
      error: "paddle did not return a checkout URL",
    };
  }

  return {
    ok: true,
    transactionId: data.data.id,
    checkoutUrl: data.data.checkout.url,
  };
}

export interface PaddleSubscriptionEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer_id?: string;
    customer?: { email?: string };
    items?: Array<{ price?: { id?: string } }>;
    transaction_id?: string;
    custom_data?: Record<string, unknown>;
  };
}
