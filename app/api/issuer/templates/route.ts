import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { verifyAuthMessage } from "@/lib/wallet-auth";

export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

const TIERS = new Set(["platinum", "gold", "silver", "bronze"]);

/**
 * GET  /api/issuer/templates?authority=<base58>
 *   Public read of an issuer's credential catalog.
 *
 * POST /api/issuer/templates
 *   Body: { slug, name, description?, defaultTier, defaultScore,
 *           displayOrder?, message, signature }
 *   Authenticated by a Phantom-signed message; the signature's
 *   embedded wallet is the issuer authority. Upserts on (authority, slug).
 *
 * DELETE /api/issuer/templates
 *   Body: { slug, message, signature }
 *   Soft-deletes (sets active=false) so historical references stay valid.
 */
export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get("authority");
  if (!authority) {
    return NextResponse.json({ error: "authority param required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("issuer_credential_templates")
    .select(
      "slug, name, description, default_tier, default_score, display_order, active, created_at",
    )
    .eq("issuer_authority", authority)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = body as {
    slug?: string;
    name?: string;
    description?: string;
    defaultTier?: string;
    defaultScore?: number;
    displayOrder?: number;
    message?: string;
    signature?: string;
  };

  const verify = verifyAuthMessage({
    message: input.message ?? "",
    signature: input.signature ?? "",
    expectedPurpose: "template-write",
  });
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: 401 });
  }

  const slug = (input.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length === 0 || slug.length > 64) {
    return NextResponse.json(
      { error: "slug must be 1–64 chars: lowercase, digits, hyphens" },
      { status: 400 },
    );
  }
  const name = (input.name ?? "").trim();
  if (!name || name.length > 96) {
    return NextResponse.json({ error: "name required, max 96 chars" }, { status: 400 });
  }
  if (!input.defaultTier || !TIERS.has(input.defaultTier)) {
    return NextResponse.json(
      { error: `defaultTier must be one of: ${[...TIERS].join(", ")}` },
      { status: 400 },
    );
  }
  const defaultScore = Number(input.defaultScore ?? 0);
  if (!Number.isInteger(defaultScore) || defaultScore < 0 || defaultScore > 100) {
    return NextResponse.json(
      { error: "defaultScore must be integer 0–100" },
      { status: 400 },
    );
  }
  const description = (input.description ?? "").trim().slice(0, 280) || null;
  const displayOrder = Number.isInteger(input.displayOrder) ? input.displayOrder! : 0;

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("issuer_credential_templates")
    .upsert(
      {
        issuer_authority: verify.wallet,
        slug,
        name,
        description,
        default_tier: input.defaultTier,
        default_score: defaultScore,
        display_order: displayOrder,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "issuer_authority,slug" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const input = body as { slug?: string; message?: string; signature?: string };

  const verify = verifyAuthMessage({
    message: input.message ?? "",
    signature: input.signature ?? "",
    expectedPurpose: "template-write",
  });
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: 401 });
  }

  const slug = (input.slug ?? "").trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("issuer_credential_templates")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("issuer_authority", verify.wallet)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug });
}
