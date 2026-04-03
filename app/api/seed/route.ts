/**
 * POST /api/seed
 *
 * Issues all Staq Financial Literacy credentials for a wallet.
 * Each credential gets a Token-2022 Non-Transferable SBT.
 *
 * Body: { wallet: string }   — target wallet (defaults to demo wallet)
 *
 * This is the complete credential issuance pipeline:
 *   1. Create Token-2022 mint with NonTransferable extension
 *   2. Create Associated Token Account for user
 *   3. Mint 1 SBT to user
 *   4. Call register_credential with the mint address
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  ExtensionType,
  createInitializeNonTransferableMintInstruction,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const RPC_URL = 'https://api.devnet.solana.com';
const DEMO_WALLET = 'AQEWftBuELL2vUHdwj7yYN3gMsRHbzJJjRGgdPyAQ8vN';

const STAQ_CREDENTIALS = [
  { slug: 'credit-score', tier: 'gold',     score: 78 },
  { slug: 'stocks',       tier: 'gold',     score: 88 },
  { slug: 'upi',          tier: 'platinum', score: 95 },
  { slug: 'sell-rules',   tier: 'gold',     score: 80 },
];

function decodeBase58(str: string): Uint8Array {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const char of str) num = num * BigInt(58) + BigInt(chars.indexOf(char));
  const bytes: number[] = [];
  while (num > BigInt(0)) { bytes.unshift(Number(num % BigInt(256))); num /= BigInt(256); }
  for (const char of str) { if (char === '1') bytes.unshift(0); else break; }
  return Uint8Array.from(bytes);
}

function getAuthority(): Keypair {
  const secretKey = process.env.STAQ_AUTHORITY_SECRET_KEY;
  if (!secretKey) throw new Error('STAQ_AUTHORITY_SECRET_KEY not set');
  return Keypair.fromSecretKey(decodeBase58(secretKey));
}

/**
 * Mint a Token-2022 Non-Transferable SBT for a credential.
 * Returns the mint public key.
 */
async function mintSBT(
  connection: Connection,
  payer: Keypair,
  userWallet: PublicKey,
  credSlug: string,
): Promise<PublicKey> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Space for mint with NonTransferable extension
  const mintLen = getMintLen([ExtensionType.NonTransferable]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  // ATA for the user (Token-2022)
  const userAta = getAssociatedTokenAddressSync(
    mint,
    userWallet,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction();

  // 1. Create mint account
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  );

  // 2. Initialize NonTransferable extension (must come before InitializeMint)
  tx.add(createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID));

  // 3. Initialize the mint (0 decimals, payer as mint authority)
  tx.add(
    createInitializeMintInstruction(
      mint,
      0,
      payer.publicKey, // mint authority
      null,            // freeze authority
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  // 4. Create ATA for user
  tx.add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,  // payer
      userAta,
      userWallet,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  );

  // 5. Mint 1 SBT to user
  tx.add(
    createMintToInstruction(
      mint,
      userAta,
      payer.publicKey, // mint authority
      1,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], {
    commitment: 'confirmed',
  });

  console.log(`SBT minted for ${credSlug}: ${mint.toBase58()} → ${userAta.toBase58()}`);
  return mint;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetWallet = body.wallet || DEMO_WALLET;

  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(targetWallet);
  } catch {
    return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
  }

  const results: { slug: string; status: string; mintAddress?: string; txSig?: string; error?: string }[] = [];

  try {
    const connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 90_000,
    });
    const authority = getAuthority();

    const idlPath = path.join(process.cwd(), 'app', 'idl.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet: any = {
      publicKey: authority.publicKey,
      signTransaction: async (tx: Transaction) => { tx.sign(authority); return tx; },
      signAllTransactions: async (txs: Transaction[]) => { txs.forEach(tx => tx.sign(authority)); return txs; },
    };
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new anchor.Program(idl, provider);

    const [issuerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), authority.publicKey.toBuffer()],
      PROGRAM_ID,
    );

    for (const cred of STAQ_CREDENTIALS) {
      const [credentialPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('credential'), authority.publicKey.toBuffer(), userPubkey.toBuffer(), Buffer.from(cred.slug)],
        PROGRAM_ID,
      );

      // Skip if credential account already exists
      const existing = await connection.getAccountInfo(credentialPda);
      if (existing) {
        results.push({ slug: cred.slug, status: 'already_exists' });
        continue;
      }

      try {
        // Mint a Token-2022 non-transferable SBT first
        const mintAddress = await mintSBT(connection, authority, userPubkey, cred.slug);

        // Register the credential on-chain with the SBT mint address
        const txSig = await (program.methods as any)
          .registerCredential(cred.slug, cred.tier, cred.score, mintAddress)
          .accounts({
            issuerAuthority: authority.publicKey,
            issuerAccount: issuerPda,
            user: userPubkey,
            credentialAccount: credentialPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        results.push({ slug: cred.slug, status: 'issued', mintAddress: mintAddress.toBase58(), txSig });
      } catch (e: unknown) {
        const err = e as Error;
        results.push({ slug: cred.slug, status: 'error', error: err.message?.slice(0, 120) });
      }
    }

    const issued = results.filter(r => r.status === 'issued').length;
    const skipped = results.filter(r => r.status === 'already_exists').length;

    return NextResponse.json({
      wallet: targetWallet,
      issued,
      skipped,
      results,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
