import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createReadonlyGlurkProgram,
  findIssuerPda,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issuer/register-tx
 *
 * Builds an UNSIGNED register_issuer transaction for the calling wallet to
 * sign and send themselves. The user's wallet acts as both `admin` (paying
 * rent) and the new issuer's `issuer_authority`. No protocol secret is used
 * — the chain has no on-chain admin gate on register_issuer; it's
 * permissionless. The frontend signs in the browser and sends.
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, name } = await req.json();

    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json({ error: 'wallet required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const trimmedName = name.trim().slice(0, 64);
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
    }

    const connection = getGlurkConnection();
    const [issuerPda] = findIssuerPda(userPubkey);

    const existing = await connection.getAccountInfo(issuerPda);
    if (existing) {
      return NextResponse.json({
        alreadyRegistered: true,
        issuerPda: issuerPda.toBase58(),
      });
    }

    // Read-only program — we don't sign here. The browser does.
    const program = createReadonlyGlurkProgram(connection, userPubkey);

    const tx = await program.methods
      .registerIssuer(trimmedName)
      .accounts({
        admin: userPubkey,
        issuerAuthority: userPubkey,
        issuerAccount: issuerPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      tx: Buffer.from(serialized).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      issuerPda: issuerPda.toBase58(),
      name: trimmedName,
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('register-tx error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
