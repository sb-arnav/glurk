import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createSigningGlurkProgram,
  findConsentPda,
  findContributionPda,
  findIssuerPda,
  getAuthorityKeypair,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

// Chain-side max_len attributes from CredentialAccount in lib.rs. Reject at
// the edge so the integrator sees a clean 400 instead of a 500 surfacing
// borsh / RPC simulation noise.
const MAX_SLUG_LEN = 64;
const MAX_TIER_LEN = 16;
const ALLOWED_TIERS = new Set(['platinum', 'gold', 'silver', 'bronze']);

/**
 * POST /api/consent
 *
 * Builds a request_access transaction, partially signs with the authority
 * (app) keypair, and returns the serialized tx for the user's wallet to sign.
 */
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { userWallet, contributionSlug, contributionTier, contributionScore } =
    (payload ?? {}) as {
      userWallet?: unknown;
      contributionSlug?: unknown;
      contributionTier?: unknown;
      contributionScore?: unknown;
    };

  if (typeof userWallet !== 'string' || !userWallet) {
    return NextResponse.json({ error: 'userWallet (string) required' }, { status: 400 });
  }
  if (typeof contributionSlug !== 'string' || !contributionSlug) {
    return NextResponse.json({ error: 'contributionSlug (string) required' }, { status: 400 });
  }
  if (typeof contributionTier !== 'string' || !contributionTier) {
    return NextResponse.json({ error: 'contributionTier (string) required' }, { status: 400 });
  }
  if (Buffer.byteLength(contributionSlug, 'utf8') > MAX_SLUG_LEN) {
    return NextResponse.json(
      { error: `contributionSlug exceeds ${MAX_SLUG_LEN} bytes` },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(contributionTier, 'utf8') > MAX_TIER_LEN) {
    return NextResponse.json(
      { error: `contributionTier exceeds ${MAX_TIER_LEN} bytes` },
      { status: 400 },
    );
  }
  if (!ALLOWED_TIERS.has(contributionTier)) {
    return NextResponse.json(
      { error: `contributionTier must be one of: ${[...ALLOWED_TIERS].join(', ')}` },
      { status: 400 },
    );
  }

  let score = 75;
  if (contributionScore !== undefined && contributionScore !== null) {
    if (
      typeof contributionScore !== 'number' ||
      !Number.isInteger(contributionScore) ||
      contributionScore < 0 ||
      contributionScore > 100
    ) {
      return NextResponse.json(
        { error: 'contributionScore must be an integer between 0 and 100' },
        { status: 400 },
      );
    }
    score = contributionScore;
  }

  let user: PublicKey;
  try {
    user = new PublicKey(userWallet);
  } catch {
    return NextResponse.json({ error: 'invalid userWallet address' }, { status: 400 });
  }

  try {
    const connection = getGlurkConnection();
    const authority = getAuthorityKeypair();
    const program = createSigningGlurkProgram(connection, authority);

    const [issuerPda] = findIssuerPda(authority.publicKey);
    const [contributionPda] = findContributionPda(authority.publicKey, user, contributionSlug);
    const [consentPda] = findConsentPda(user, authority.publicKey);

    const [existingConsent, existingContribution] = await Promise.all([
      connection.getAccountInfo(consentPda),
      connection.getAccountInfo(contributionPda),
    ]);

    // ConsentAccount layout: 8 discriminator + 32 user + 32 requester + 8 granted_at + 1 active
    // We only short-circuit when the consent is currently active; a revoked
    // consent must fall through so the user can re-grant in this same flow.
    const consentIsActive =
      !!existingConsent && existingConsent.data.length >= 81 && existingConsent.data[80] === 1;

    if (consentIsActive && existingContribution) {
      return NextResponse.json({
        alreadyGranted: true,
        pdas: {
          contribution: contributionPda.toBase58(),
          consent: consentPda.toBase58(),
        },
      });
    }

    const tx = await program.methods
      .requestAccess(contributionSlug, contributionTier, score)
      .accounts({
        requesterAuthority: authority.publicKey,
        user,
        requesterIssuer: issuerPda,
        contributionAccount: contributionPda,
        consentAccount: consentPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.partialSign(authority);

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

    return NextResponse.json({
      tx: Buffer.from(serialized).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      pdas: {
        contribution: contributionPda.toBase58(),
        consent: consentPda.toBase58(),
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('consent API error:', err);
    // getAuthorityKeypair throws when STAQ_AUTHORITY_SECRET_KEY is unset.
    // Surface that as a 503 (service not configured) without naming the env var.
    if (err.message?.includes('STAQ_AUTHORITY_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'consent service not configured' },
        { status: 503 },
      );
    }
    // Don't leak Solana RPC URLs, internal stack hints, env var names, etc.
    // The full error is logged server-side; client gets a generic 500.
    return NextResponse.json(
      { error: 'failed to build consent transaction' },
      { status: 500 },
    );
  }
}
