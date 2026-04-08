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

/**
 * POST /api/consent
 *
 * Builds a request_access transaction, partially signs with the authority
 * (app) keypair, and returns the serialized tx for the user's wallet to sign.
 */
export async function POST(req: NextRequest) {
  try {
    const { userWallet, contributionSlug, contributionTier, contributionScore } =
      await req.json();

    if (!userWallet || !contributionSlug || !contributionTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = getGlurkConnection();
    const authority = getAuthorityKeypair();
    const user = new PublicKey(userWallet);
    const program = createSigningGlurkProgram(connection, authority);

    const [issuerPda] = findIssuerPda(authority.publicKey);
    const [contributionPda] = findContributionPda(authority.publicKey, user, contributionSlug);
    const [consentPda] = findConsentPda(user, authority.publicKey);

    const [existingConsent, existingContribution] = await Promise.all([
      connection.getAccountInfo(consentPda),
      connection.getAccountInfo(contributionPda),
    ]);

    if (existingConsent && existingContribution) {
      return NextResponse.json({
        alreadyGranted: true,
        pdas: {
          contribution: contributionPda.toBase58(),
          consent: consentPda.toBase58(),
        },
      });
    }

    const tx = await program.methods
      .requestAccess(
        contributionSlug,
        contributionTier,
        contributionScore ?? 75,
      )
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
    console.error('consent API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
