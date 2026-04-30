import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSerializedGlurkProfile, normalizeEmail } from '@/lib/glurk-profile';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
// Brief cache to take pressure off devnet RPC. Score and credentials only
// change when an issuer writes — slightly stale reads are fine for the
// integrator path. Bump down to 0 if you need real-time.
export const revalidate = 30;

const COMMON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 's-maxage=30, stale-while-revalidate=120',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: COMMON_HEADERS });
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
  const wallet = req.nextUrl.searchParams.get('wallet');
  const email = req.nextUrl.searchParams.get('email');

  if (!wallet && !email) {
    const err: CheckError = {
      ok: false,
      error: 'wallet or email query param required',
    };
    return NextResponse.json(err, { status: 400, headers: COMMON_HEADERS });
  }

  let resolvedWallet = wallet;
  if (!resolvedWallet && email) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from('identity_links')
      .select('wallet_address')
      .eq('email', normalizeEmail(email))
      .single();
    if (error || !data) {
      const err: CheckError = { ok: false, error: 'no wallet linked to this email' };
      return NextResponse.json(err, { status: 404, headers: COMMON_HEADERS });
    }
    resolvedWallet = data.wallet_address;
  }

  try {
    new PublicKey(resolvedWallet!);
  } catch {
    const err: CheckError = { ok: false, error: 'invalid wallet address' };
    return NextResponse.json(err, { status: 400, headers: COMMON_HEADERS });
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

    return NextResponse.json(body, { headers: COMMON_HEADERS });
  } catch (e) {
    const err: CheckError = { ok: false, error: (e as Error).message };
    return NextResponse.json(err, { status: 500, headers: COMMON_HEADERS });
  }
}
