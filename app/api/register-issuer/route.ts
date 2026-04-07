import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const RPC_URL = 'https://api.devnet.solana.com';

function decodeBase58(str: string): Uint8Array {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const char of str) num = num * BigInt(58) + BigInt(chars.indexOf(char));
  const bytes: number[] = [];
  while (num > BigInt(0)) { bytes.unshift(Number(num % BigInt(256))); num /= BigInt(256); }
  for (const char of str) { if (char === '1') bytes.unshift(0); else break; }
  return Uint8Array.from(bytes);
}

function getAdminKeypair(): Keypair {
  const key = process.env.STAQ_AUTHORITY_SECRET_KEY;
  if (!key) throw new Error('STAQ_AUTHORITY_SECRET_KEY not set');
  return Keypair.fromSecretKey(decodeBase58(key));
}

/**
 * POST /api/register-issuer
 *
 * Admin-only. Registers a new issuer on-chain.
 * The admin keypair (protocol authority) signs and pays.
 *
 * Body: {
 *   issuerWallet: string,   — the issuer's wallet address (their authority pubkey)
 *   name: string,           — display name for the issuer
 *   adminSecret: string,    — must match REGISTER_ISSUER_SECRET env var
 * }
 *
 * Returns: { ok: true, issuerPda, txSig }
 */
export async function POST(req: NextRequest) {
  try {
    const { issuerWallet, name, adminSecret } = await req.json();

    // Gate with a shared secret so this endpoint isn't open to anyone
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

    const connection = new Connection(RPC_URL, 'confirmed');
    const admin = getAdminKeypair();

    const idlPath = path.join(process.cwd(), 'app', 'idl.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet: any = {
      publicKey: admin.publicKey,
      signTransaction: async (tx: Transaction) => { tx.sign(admin); return tx; },
      signAllTransactions: async (txs: Transaction[]) => { txs.forEach(tx => tx.sign(admin)); return txs; },
    };

    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new anchor.Program(idl, provider);

    const [issuerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), issuerAuthority.toBuffer()],
      PROGRAM_ID,
    );

    // Check if already registered
    const existing = await connection.getAccountInfo(issuerPda);
    if (existing) {
      return NextResponse.json({
        ok: true,
        issuerPda: issuerPda.toBase58(),
        alreadyExists: true,
      });
    }

    const txSig = await (program.methods as any)
      .registerIssuer(name)
      .accounts({
        admin: admin.publicKey,
        issuerAuthority,
        issuerAccount: issuerPda,
        systemProgram: SystemProgram.programId,
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
