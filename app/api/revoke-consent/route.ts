import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createReadonlyGlurkProgram,
  findConsentPda,
  getGlurkConnection,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

/**
 * POST /api/revoke-consent
 *
 * Builds a revoke_access transaction for the user to sign.
 * The user must co-sign, so we return the unsigned tx for Phantom to sign.
 */
export async function POST(req: NextRequest) {
  try {
    const { userWallet, requesterWallet } = await req.json();

    if (!userWallet || !requesterWallet) {
      return NextResponse.json({ error: 'userWallet and requesterWallet required' }, { status: 400 });
    }

    let user: PublicKey;
    let requester: PublicKey;
    try {
      user = new PublicKey(userWallet);
      requester = new PublicKey(requesterWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const connection = getGlurkConnection();
    const program = createReadonlyGlurkProgram(connection, user);
    const [consentPda] = findConsentPda(user, requester);

    const consentInfo = await connection.getAccountInfo(consentPda);
    if (!consentInfo) {
      return NextResponse.json({ error: 'Consent not found on-chain' }, { status: 404 });
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    const tx = await program.methods
      .revokeAccess()
      .accounts({
        user,
        consentAccount: consentPda,
        requester,
      })
      .transaction();

    tx.recentBlockhash = blockhash;
    tx.feePayer = user;

    return NextResponse.json({
      tx: tx.serialize({ requireAllSignatures: false }).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      consentPda: consentPda.toBase58(),
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
