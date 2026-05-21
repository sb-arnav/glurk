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
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { userWallet, requesterWallet } = (payload ?? {}) as {
    userWallet?: unknown;
    requesterWallet?: unknown;
  };

  if (typeof userWallet !== 'string' || !userWallet) {
    return NextResponse.json({ error: 'userWallet (string) required' }, { status: 400 });
  }
  if (typeof requesterWallet !== 'string' || !requesterWallet) {
    return NextResponse.json({ error: 'requesterWallet (string) required' }, { status: 400 });
  }

  let user: PublicKey;
  let requester: PublicKey;
  try {
    user = new PublicKey(userWallet);
    requester = new PublicKey(requesterWallet);
  } catch {
    return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
  }

  try {
    const connection = getGlurkConnection();
    const program = createReadonlyGlurkProgram(connection, user);
    const [consentPda] = findConsentPda(user, requester);

    const consentInfo = await connection.getAccountInfo(consentPda);
    if (!consentInfo) {
      return NextResponse.json({ error: 'consent not found on-chain' }, { status: 404 });
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

    // web3.js' Transaction.serialize returns a Buffer on Node and a Uint8Array
    // in some bundled environments. Wrap in Buffer.from so .toString('base64')
    // always returns base64 (calling it on a Uint8Array returns garbage).
    const serialized = tx.serialize({ requireAllSignatures: false });

    return NextResponse.json({
      tx: Buffer.from(serialized).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      consentPda: consentPda.toBase58(),
    });
  } catch (e: unknown) {
    console.error('revoke-consent API error:', e);
    return NextResponse.json(
      { error: 'failed to build revoke transaction' },
      { status: 500 },
    );
  }
}
