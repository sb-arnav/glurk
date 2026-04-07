import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const RPC_URL = 'https://api.devnet.solana.com';

/**
 * POST /api/revoke-consent
 *
 * Builds a revoke_access transaction for the user to sign.
 * The user must co-sign — we return the unsigned tx for Phantom to sign.
 *
 * Body: { userWallet: string, requesterWallet: string }
 *
 * Returns: { tx: string (base64), blockhash, lastValidBlockHeight }
 */
export async function POST(req: NextRequest) {
  try {
    const { userWallet, requesterWallet } = await req.json();

    if (!userWallet || !requesterWallet) {
      return NextResponse.json({ error: 'userWallet and requesterWallet required' }, { status: 400 });
    }

    let user: PublicKey, requester: PublicKey;
    try {
      user = new PublicKey(userWallet);
      requester = new PublicKey(requesterWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const idlPath = path.join(process.cwd(), 'app', 'idl.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

    // Dummy wallet for provider (no signing — user signs client-side)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dummyWallet: any = {
      publicKey: user,
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
    };

    const provider = new anchor.AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
    const program = new anchor.Program(idl, provider);

    const [consentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), user.toBuffer(), requester.toBuffer()],
      PROGRAM_ID,
    );

    // Verify the consent account exists and is active
    const consentInfo = await connection.getAccountInfo(consentPda);
    if (!consentInfo) {
      return NextResponse.json({ error: 'Consent not found on-chain' }, { status: 404 });
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Build the transaction — user must sign client-side
    const tx = await (program.methods as any)
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
