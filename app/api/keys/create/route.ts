import { NextRequest, NextResponse } from 'next/server';
import { provisionApiKey, type Tier } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

const VALID_TIERS = new Set<Tier>(['free', 'pro', 'enterprise']);

/**
 * POST /api/keys/create
 *
 * Self-serve provisioning for the free tier. Pro/Enterprise tiers
 * require GLURK_ADMIN_SECRET (passed in `adminSecret`) — billing is
 * handled out-of-band until Paddle integration ships.
 *
 * Body: {
 *   email: string,
 *   tier?: 'free' | 'pro' | 'enterprise',  // default 'free'
 *   appName?: string,
 *   adminSecret?: string                   // required for non-free
 * }
 *
 * Returns: { ok: true, key: string, tier } — show the key to the
 * caller exactly once. We do NOT email it; the page is the only place
 * the user sees it.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const input = body as {
    email?: string;
    tier?: string;
    appName?: string;
    adminSecret?: string;
  };

  const requestedTier = (input.tier ?? 'free') as Tier;
  if (!VALID_TIERS.has(requestedTier)) {
    return NextResponse.json(
      { error: `tier must be one of: ${[...VALID_TIERS].join(', ')}` },
      { status: 400 },
    );
  }

  if (!input.email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const result = await provisionApiKey({
    email: input.email,
    tier: requestedTier,
    appName: input.appName,
    adminSecret: input.adminSecret,
  });

  if (!result.ok) {
    const status = result.error?.includes('admin') ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    key: result.key,
    tier: result.tier,
    note: 'Store this key — it will not be shown again.',
  });
}
