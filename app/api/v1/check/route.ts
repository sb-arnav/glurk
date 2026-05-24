import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSerializedGlurkProfile, normalizeEmail } from '@/lib/glurk-profile';
import { createClient } from '@supabase/supabase-js';
import { consumeApiKey, readApiKey, TIER_QUOTAS } from '@/lib/api-keys';
import {
  FIXTURE_ORDER,
  isTestWallet,
  resolveFixture,
} from '@/lib/test-fixtures';

export const dynamic = 'force-dynamic';
// Brief cache to take pressure off devnet RPC. Score and credentials only
// change when an issuer writes — slightly stale reads are fine for the
// integrator path. Bump down to 0 if you need real-time.
export const revalidate = 30;

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Glurk-Api-Key',
  'Cache-Control': 's-maxage=30, stale-while-revalidate=120',
};

// Free anonymous tier — gentle ceiling baked into the cache headers
// since we don't have edge rate limiting yet. Pro keys get higher
// monthly quotas tracked in Postgres.
const ANONYMOUS_TIER_QUOTA = 100; // signals soft ceiling; actual enforcement is via cache + chain RPC throttle

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

function rateHeaders(extras: Record<string, string>): Record<string, string> {
  return { ...BASE_HEADERS, ...extras };
}

interface CheckResponse {
  ok: true;
  wallet: string;
  glurkScore: number;
  credentialCount: number;
  issuerCount: number;
  credentials: Array<{
    issuer: string;
    slug: string;
    tier: string;
    score: number;
    timestamp: number;
    pda: string;
  }>;
  network: 'devnet';
  generatedAt: number;
  /** Present and `true` only when the wallet was a `test:*` sentinel. */
  test?: true;
}

interface CheckError {
  ok: false;
  error: string;
}

/**
 * GET /api/v1/check?wallet=<base58>
 * GET /api/v1/check?email=user@example.com
 *
 * The canonical "verify any wallet" endpoint for headless integrators.
 *
 * Returns a small, stable JSON shape designed for direct consumption
 * (no SDK install needed, language-agnostic). The response shape under
 * /api/v1 is versioned and treated as a public contract. New fields
 * may be added; existing fields will not be removed or repurposed
 * within this version.
 *
 * Use cases:
 *   - DeFi: pre-screen a borrower wallet before underwriting
 *   - Hiring: verify claimed skills before scheduling an interview
 *   - DAOs: gate proposals on minimum Glurk Score
 *   - Drops: airdrop only to wallets with credentials from issuer X
 */
export async function GET(req: NextRequest) {
  // ─── Tier resolution & quota check ───
  const apiKey = readApiKey(req, req.nextUrl);
  let tier = 'anonymous';
  let quotaRemaining: number | null = null;
  let quotaTotal = ANONYMOUS_TIER_QUOTA;

  if (apiKey) {
    const result = await consumeApiKey(apiKey);
    if (!result.ok) {
      const status = result.reason === 'quota_exceeded' ? 429 : 401;
      const err: CheckError = {
        ok: false,
        error:
          result.reason === 'quota_exceeded'
            ? 'monthly quota exceeded for this API key'
            : result.reason === 'deactivated'
              ? 'this API key has been deactivated'
              : 'invalid API key',
      };
      return NextResponse.json(err, {
        status,
        headers: rateHeaders({
          'X-Glurk-Tier': tier,
          'X-Glurk-Quota-Remaining': '0',
        }),
      });
    }
    tier = result.record!.tier;
    quotaRemaining = result.remaining ?? null;
    quotaTotal = result.record!.monthly_quota;
  }

  const wallet = req.nextUrl.searchParams.get('wallet');
  const email = req.nextUrl.searchParams.get('email');

  const responseHeaders = rateHeaders({
    'X-Glurk-Tier': tier,
    'X-Glurk-Quota-Total': String(quotaTotal),
    'X-Glurk-Quota-Remaining':
      quotaRemaining !== null ? String(quotaRemaining) : 'unlimited',
  });

  if (!wallet && !email) {
    const err: CheckError = {
      ok: false,
      error: 'wallet or email query param required',
    };
    return NextResponse.json(err, { status: 400, headers: responseHeaders });
  }

  // ─── Test mode: deterministic fixtures (no chain read) ───
  // Sentinel wallets like `test:approve` short-circuit to a synthetic profile.
  // Lets integrators write CI tests without finding real wallets in every
  // edge-case state. See lib/test-fixtures.ts for the catalog.
  if (wallet && isTestWallet(wallet)) {
    const fixture = resolveFixture(wallet);
    if (!fixture) {
      const err: CheckError = {
        ok: false,
        error: `unknown test scenario. Available: ${FIXTURE_ORDER.map((s) => `test:${s}`).join(', ')}`,
      };
      return NextResponse.json(err, {
        status: 400,
        headers: { ...responseHeaders, 'X-Glurk-Test-Mode': 'true' },
      });
    }
    const issuerCount = new Set(fixture.credentials.map((c) => c.issuer)).size;
    const body: CheckResponse = {
      ok: true,
      wallet,
      glurkScore: fixture.glurkScore,
      credentialCount: fixture.credentials.length,
      issuerCount,
      credentials: fixture.credentials,
      network: 'devnet',
      generatedAt: Math.floor(Date.now() / 1000),
      test: true,
    };
    return NextResponse.json(body, {
      headers: { ...responseHeaders, 'X-Glurk-Test-Mode': 'true' },
    });
  }

  let resolvedWallet = wallet;
  if (!resolvedWallet && email) {
    // Service-role: identity_links is email<->wallet PII locked under RLS.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data, error } = await supabase
      .from('identity_links')
      .select('wallet_address')
      .eq('email', normalizeEmail(email))
      .single();
    if (error || !data) {
      const err: CheckError = { ok: false, error: 'no wallet linked to this email' };
      return NextResponse.json(err, { status: 404, headers: responseHeaders });
    }
    resolvedWallet = data.wallet_address;
  }

  try {
    new PublicKey(resolvedWallet!);
  } catch {
    const err: CheckError = { ok: false, error: 'invalid wallet address' };
    return NextResponse.json(err, { status: 400, headers: responseHeaders });
  }

  try {
    const profile = await getSerializedGlurkProfile(resolvedWallet!);
    const issuerCount = new Set(profile.credentials.map((c) => c.issuer)).size;

    const body: CheckResponse = {
      ok: true,
      wallet: resolvedWallet!,
      glurkScore: profile.glurkScore,
      credentialCount: profile.credentials.length,
      issuerCount,
      credentials: profile.credentials.map((c) => ({
        issuer: c.issuer,
        slug: c.slug,
        tier: c.tier,
        score: c.score,
        timestamp: c.timestamp,
        pda: c.pubkey,
      })),
      network: 'devnet',
      generatedAt: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(body, { headers: responseHeaders });
  } catch (e) {
    const err: CheckError = { ok: false, error: (e as Error).message };
    return NextResponse.json(err, { status: 500, headers: responseHeaders });
  }
}

// Re-export for typing reference; the helper module is the source of truth.
export { TIER_QUOTAS };
