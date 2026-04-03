import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Keypair,
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
  for (const char of str) {
    num = num * BigInt(58) + BigInt(chars.indexOf(char));
  }
  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }
  for (const char of str) {
    if (char === '1') bytes.unshift(0);
    else break;
  }
  return Uint8Array.from(bytes);
}

function getAuthorityKeypair(): Keypair {
  const secretKey = process.env.STAQ_AUTHORITY_SECRET_KEY;
  if (!secretKey) throw new Error('STAQ_AUTHORITY_SECRET_KEY not set');
  return Keypair.fromSecretKey(decodeBase58(secretKey));
}

/**
 * POST /api/consent
 *
 * Builds a request_access transaction, partially signs with the authority
 * (app) keypair, and returns the serialized tx for the user's wallet to sign.
 *
 * Body: {
 *   userWallet: string,          — user's base58 pubkey
 *   contributionSlug: string,    — e.g. "trading-history"
 *   contributionTier: string,    — e.g. "gold"
 *   contributionScore: number,   — 0-100
 * }
 *
 * Returns: {
 *   tx: string,                  — base64 serialized partial tx
 *   pdas: { contribution, consent },
 *   alreadyGranted?: boolean,    — true if consent already exists on-chain
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userWallet, contributionSlug, contributionTier, contributionScore } =
      await req.json();

    if (!userWallet || !contributionSlug || !contributionTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const authority = getAuthorityKeypair();
    const user = new PublicKey(userWallet);

    // Derive PDAs
    const [issuerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), authority.publicKey.toBuffer()],
      PROGRAM_ID,
    );
    const [contributionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('credential'),
        authority.publicKey.toBuffer(),
        user.toBuffer(),
        Buffer.from(contributionSlug),
      ],
      PROGRAM_ID,
    );
    const [consentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), user.toBuffer(), authority.publicKey.toBuffer()],
      PROGRAM_ID,
    );

    // Check if consent already exists and is active
    const existingConsent = await connection.getAccountInfo(consentPda);
    const existingContribution = await connection.getAccountInfo(contributionPda);

    if (existingConsent && existingContribution) {
      return NextResponse.json({
        alreadyGranted: true,
        pdas: {
          contribution: contributionPda.toBase58(),
          consent: consentPda.toBase58(),
        },
      });
    }

    // Load IDL and build program
    const idlPath = path.join(process.cwd(), 'app', 'idl.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet: any = {
      publicKey: authority.publicKey,
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
    };
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new anchor.Program(idl, provider);

    // Build the transaction (don't .rpc() — we need Phantom to co-sign)
    const tx = await (program.methods as any)
      .requestAccess(
        contributionSlug,
        contributionTier,
        contributionScore ?? 75,
      )
      .accounts({
        requesterAuthority: authority.publicKey,
        user: user,
        requesterIssuer: issuerPda,
        contributionAccount: contributionPda,
        consentAccount: consentPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    // Set blockhash and fee payer (authority pays)
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;

    // Partial sign with authority — user (Phantom) must still sign
    tx.partialSign(authority);

    // Serialize allowing missing user signature
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
