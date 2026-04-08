import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createSigningGlurkProgram,
  findIssuerPda,
  getAuthorityKeypair,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

/**
 * POST /api/register-issuer
 *
 * Admin-only. Registers a new issuer on-chain.
 */
export async function POST(req: NextRequest) {
  try {
    const { issuerWallet, name, adminSecret } = await req.json();

    const expectedSecret = process.env.REGISTER_ISSUER_SECRET;
    if (!expectedSecret || adminSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!issuerWallet || !name) {
      return NextResponse.json({ error: 'issuerWallet and name required' }, { status: 400 });
    }

    let issuerAuthority: PublicKey;
    try {
      issuerAuthority = new PublicKey(issuerWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid issuerWallet address' }, { status: 400 });
    }

    const connection = getGlurkConnection();
    const admin = getAuthorityKeypair();
    const program = createSigningGlurkProgram(connection, admin);
    const [issuerPda] = findIssuerPda(issuerAuthority);

    const existing = await connection.getAccountInfo(issuerPda);
    if (existing) {
      return NextResponse.json({
        ok: true,
        issuerPda: issuerPda.toBase58(),
        alreadyExists: true,
      });
    }

    const txSig = await program.methods
      .registerIssuer(name)
      .accounts({
        admin: admin.publicKey,
        issuerAuthority,
        issuerAccount: issuerPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .rpc();

    return NextResponse.json({
      ok: true,
      issuerPda: issuerPda.toBase58(),
      txSig,
      name,
      issuerWallet,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
