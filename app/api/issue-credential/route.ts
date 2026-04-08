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
import {
  createSigningGlurkProgram,
  findIssuerPda,
  getAuthorityKeypair,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
  GLURK_PROGRAM_ID,
} from '@/lib/glurk-program';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/issue-credential
 *
 * Issues a single on-chain credential to a user wallet.
 * This is the clean issuer-facing API — call this from your backend
 * when a user earns a credential.
 *
 * Auth: Bearer token matching REGISTER_ISSUER_SECRET env var.
 *
 * Body: {
 *   wallet: string,    — user's Solana wallet (base58)
 *   slug: string,      — credential identifier (e.g. "credit-score")
 *   tier: string,      — "platinum" | "gold" | "silver" | "bronze"
 *   score: number,     — 0-100 module/skill score
 *   email?: string,    — optional: auto-links email → wallet in identity_links
 * }
 *
 * Returns: { ok, slug, mintAddress, txSig, credentialPda }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedSecret = process.env.REGISTER_ISSUER_SECRET;
    if (!expectedSecret || token !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wallet, slug, tier, score, email } = await req.json();

    if (!wallet || !slug || !tier || score === undefined) {
      return NextResponse.json(
        { error: 'wallet, slug, tier, and score are required' },
        { status: 400 },
      );
    }

    const validTiers = ['platinum', 'gold', 'silver', 'bronze'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: `tier must be one of: ${validTiers.join(', ')}` }, { status: 400 });
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json({ error: 'score must be 0-100' }, { status: 400 });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 90_000,
    });
    const authority = getAuthorityKeypair();

    // Derive credential PDA
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), authority.publicKey.toBuffer(), userPubkey.toBuffer(), Buffer.from(slug)],
      GLURK_PROGRAM_ID,
    );

    // Skip if already exists
    const existing = await connection.getAccountInfo(credentialPda);
    if (existing) {
      return NextResponse.json({
        ok: true,
        slug,
        alreadyExists: true,
        credentialPda: credentialPda.toBase58(),
      });
    }

    // Mint Token-2022 non-transferable SBT
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const mintLen = getMintLen([ExtensionType.NonTransferable]);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const userAta = getAssociatedTokenAddressSync(
      mint, userPubkey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const mintTx = new Transaction();
    mintTx.add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    );
    mintTx.add(createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID));
    mintTx.add(createInitializeMintInstruction(mint, 0, authority.publicKey, null, TOKEN_2022_PROGRAM_ID));
    mintTx.add(createAssociatedTokenAccountInstruction(
      authority.publicKey, userAta, userPubkey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ));
    mintTx.add(createMintToInstruction(mint, userAta, authority.publicKey, 1, [], TOKEN_2022_PROGRAM_ID));

    await sendAndConfirmTransaction(connection, mintTx, [authority, mintKeypair], {
      commitment: 'confirmed',
    });

    // Register credential on-chain
    const program = createSigningGlurkProgram(connection, authority);
    const [issuerPda] = findIssuerPda(authority.publicKey);

    const txSig = await program.methods
      .registerCredential(slug, tier, score, mint)
      .accounts({
        issuerAuthority: authority.publicKey,
        issuerAccount: issuerPda,
        user: userPubkey,
        credentialAccount: credentialPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .rpc();

    // Auto-link email → wallet if provided
    if (email && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      const { error: linkError } = await supabase
        .from('identity_links')
        .upsert(
          { email: email.toLowerCase().trim(), wallet_address: wallet },
          { onConflict: 'email' },
        );
      if (linkError) console.error('identity link failed:', linkError.message);
    }

    return NextResponse.json({
      ok: true,
      slug,
      tier,
      score,
      mintAddress: mint.toBase58(),
      txSig,
      credentialPda: credentialPda.toBase58(),
      wallet,
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('issue-credential error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
