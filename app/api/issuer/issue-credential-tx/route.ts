import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createReadonlyGlurkProgram,
  findCredentialPda,
  findIssuerPda,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

const TIER_VALUES = new Set(['platinum', 'gold', 'silver', 'bronze']);

/**
 * POST /api/issuer/issue-credential-tx
 *
 * Builds an UNSIGNED register_credential transaction for the issuer to sign
 * and send themselves. The caller's wallet is the issuer_authority, which
 * must already be a registered issuer (the program verifies this on-chain).
 *
 * Body: { issuerWallet, userWallet, slug, tier, score }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issuerWallet, userWallet, slug, tier, score } = body;

    if (!issuerWallet || typeof issuerWallet !== 'string') {
      return NextResponse.json({ error: 'issuerWallet required' }, { status: 400 });
    }
    if (!userWallet || typeof userWallet !== 'string') {
      return NextResponse.json({ error: 'userWallet required' }, { status: 400 });
    }
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }
    const trimmedSlug = slug.trim().toLowerCase().slice(0, 64);
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      return NextResponse.json(
        { error: 'slug must be lowercase letters, digits, and hyphens only' },
        { status: 400 },
      );
    }
    if (!TIER_VALUES.has(tier)) {
      return NextResponse.json(
        { error: `tier must be one of: ${[...TIER_VALUES].join(', ')}` },
        { status: 400 },
      );
    }
    const parsedScore = Number(score);
    if (!Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      return NextResponse.json({ error: 'score must be an integer 0–100' }, { status: 400 });
    }

    let issuerPubkey: PublicKey;
    let userPubkey: PublicKey;
    try {
      issuerPubkey = new PublicKey(issuerWallet);
      userPubkey = new PublicKey(userWallet);
    } catch {
      return NextResponse.json({ error: 'invalid pubkey' }, { status: 400 });
    }

    const connection = getGlurkConnection();
    const [issuerPda] = findIssuerPda(issuerPubkey);
    const [credentialPda] = findCredentialPda(issuerPubkey, userPubkey, trimmedSlug);

    const issuerAccount = await connection.getAccountInfo(issuerPda);
    if (!issuerAccount) {
      return NextResponse.json(
        { error: 'Wallet is not a registered issuer. Register at /issuers/register first.' },
        { status: 400 },
      );
    }

    const existingCredential = await connection.getAccountInfo(credentialPda);
    if (existingCredential) {
      return NextResponse.json({
        alreadyIssued: true,
        credentialPda: credentialPda.toBase58(),
      });
    }

    const program = createReadonlyGlurkProgram(connection, issuerPubkey);
    const tx = await program.methods
      .registerCredential(trimmedSlug, tier, parsedScore, PublicKey.default)
      .accounts({
        issuerAuthority: issuerPubkey,
        issuerAccount: issuerPda,
        user: userPubkey,
        credentialAccount: credentialPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = issuerPubkey;

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      tx: Buffer.from(serialized).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      credentialPda: credentialPda.toBase58(),
      slug: trimmedSlug,
      tier,
      score: parsedScore,
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('issue-credential-tx error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
