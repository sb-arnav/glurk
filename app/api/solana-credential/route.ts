import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
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
import {
  createSigningGlurkProgram,
  findIssuerPda,
  GLURK_SYSTEM_PROGRAM_ID,
  GLURK_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

// Use the same GitHub issuer keypair for now — in production, each source gets its own
const SOLANA_ISSUER_PUBKEY = new PublicKey('JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k');

function getIssuerKeypair(): Keypair {
  const key = process.env.GITHUB_ISSUER_SECRET_KEY;
  if (!key) throw new Error('GITHUB_ISSUER_SECRET_KEY not set');
  return Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(key));
}

function calcTierAndScore(stats: {
  txCount: number;
  solBalance: number;
  tokenAccounts: number;
  accountAge: number; // days
}) {
  // Score: weighted combination of on-chain activity (0-100)
  const txScore = Math.min(30, Math.sqrt(stats.txCount) * 3);
  const balanceScore = Math.min(20, Math.sqrt(stats.solBalance) * 10);
  const tokenScore = Math.min(25, stats.tokenAccounts * 2.5);
  const ageScore = Math.min(25, stats.accountAge * 0.07);
  const score = Math.min(100, Math.round(txScore + balanceScore + tokenScore + ageScore));

  let tier: string;
  if (score >= 85) tier = 'platinum';
  else if (score >= 65) tier = 'gold';
  else if (score >= 40) tier = 'silver';
  else tier = 'bronze';

  return { score, tier };
}

/**
 * POST /api/solana-credential
 *
 * Analyzes a Solana wallet's on-chain activity and issues a credential.
 * No OAuth needed — just a wallet address.
 *
 * Body: { wallet: string, email?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, email } = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: 'wallet required' }, { status: 400 });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const mainnetConn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const devnetConn = new Connection('https://api.devnet.solana.com', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 90_000,
    });

    // Read mainnet data for real activity
    const [balance, signatures, tokenAccounts] = await Promise.allSettled([
      mainnetConn.getBalance(userPubkey),
      mainnetConn.getSignaturesForAddress(userPubkey, { limit: 100 }),
      mainnetConn.getParsedTokenAccountsByOwner(userPubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }),
    ]);

    const solBalance = balance.status === 'fulfilled' ? balance.value / LAMPORTS_PER_SOL : 0;
    const txCount = signatures.status === 'fulfilled' ? signatures.value.length : 0;
    const tokenCount = tokenAccounts.status === 'fulfilled' ? tokenAccounts.value.value.length : 0;

    // Estimate account age from oldest transaction
    let accountAge = 0;
    if (signatures.status === 'fulfilled' && signatures.value.length > 0) {
      const oldest = signatures.value[signatures.value.length - 1];
      if (oldest.blockTime) {
        accountAge = Math.floor((Date.now() / 1000 - oldest.blockTime) / 86400);
      }
    }

    const stats = { txCount, solBalance, tokenAccounts: tokenCount, accountAge };
    const { score, tier } = calcTierAndScore(stats);

    const issuerKeypair = getIssuerKeypair();
    const slug = 'solana-activity';

    // Check if credential already exists on devnet
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), issuerKeypair.publicKey.toBuffer(), userPubkey.toBuffer(), Buffer.from(slug)],
      GLURK_PROGRAM_ID,
    );

    const existing = await devnetConn.getAccountInfo(credentialPda);
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        credential: { slug, tier, score, credentialPda: credentialPda.toBase58() },
        stats,
      });
    }

    // Mint Token-2022 SBT on devnet
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const mintLen = getMintLen([ExtensionType.NonTransferable]);
    const lamports = await devnetConn.getMinimumBalanceForRentExemption(mintLen);

    const userAta = getAssociatedTokenAddressSync(
      mint, userPubkey, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const mintTx = new Transaction();
    mintTx.add(
      SystemProgram.createAccount({
        fromPubkey: issuerKeypair.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    );
    mintTx.add(createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID));
    mintTx.add(createInitializeMintInstruction(mint, 0, issuerKeypair.publicKey, null, TOKEN_2022_PROGRAM_ID));
    mintTx.add(createAssociatedTokenAccountInstruction(
      issuerKeypair.publicKey, userAta, userPubkey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ));
    mintTx.add(createMintToInstruction(mint, userAta, issuerKeypair.publicKey, 1, [], TOKEN_2022_PROGRAM_ID));

    await sendAndConfirmTransaction(devnetConn, mintTx, [issuerKeypair, mintKeypair], {
      commitment: 'confirmed',
    });

    // Register credential PDA
    const program = createSigningGlurkProgram(devnetConn, issuerKeypair);
    const [issuerPda] = findIssuerPda(issuerKeypair.publicKey);

    const txSig = await program.methods
      .registerCredential(slug, tier, score, mint)
      .accounts({
        issuerAuthority: issuerKeypair.publicKey,
        issuerAccount: issuerPda,
        user: userPubkey,
        credentialAccount: credentialPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .rpc();

    // Auto-link email if provided
    if (email && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      await supabase
        .from('identity_links')
        .upsert(
          { email: email.toLowerCase().trim(), wallet_address: wallet },
          { onConflict: 'email' },
        );
    }

    return NextResponse.json({
      ok: true,
      credential: {
        slug,
        tier,
        score,
        mintAddress: mint.toBase58(),
        txSig,
        credentialPda: credentialPda.toBase58(),
      },
      stats,
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('solana-credential error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
