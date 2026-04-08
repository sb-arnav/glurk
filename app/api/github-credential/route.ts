import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
import {
  createSigningGlurkProgram,
  findIssuerPda,
  GLURK_SYSTEM_PROGRAM_ID,
  GLURK_PROGRAM_ID,
} from '@/lib/glurk-program';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const GITHUB_ISSUER_PUBKEY = new PublicKey('JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k');

function getGithubIssuerKeypair(): Keypair {
  const key = process.env.GITHUB_ISSUER_SECRET_KEY;
  if (!key) throw new Error('GITHUB_ISSUER_SECRET_KEY not set');
  return Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(key));
}

function calcTierAndScore(stats: { repos: number; followers: number; stars: number; contributions: number }) {
  // Score: weighted combination of GitHub activity (0-100)
  const repoScore = Math.min(30, stats.repos * 1.5);
  const followerScore = Math.min(25, stats.followers * 0.5);
  const starScore = Math.min(25, Math.sqrt(stats.stars) * 5);
  const contribScore = Math.min(20, stats.contributions * 0.02);
  const score = Math.min(100, Math.round(repoScore + followerScore + starScore + contribScore));

  let tier: string;
  if (score >= 90) tier = 'platinum';
  else if (score >= 70) tier = 'gold';
  else if (score >= 45) tier = 'silver';
  else tier = 'bronze';

  return { score, tier };
}

/**
 * POST /api/github-credential
 *
 * Authenticated endpoint. Fetches the user's GitHub stats,
 * calculates a reputation score, and issues a Glurk credential
 * from the GitHub Reputation issuer.
 *
 * Requires: GitHub OAuth session (via NextAuth)
 * Returns: { ok, credential: { slug, tier, score, mintAddress, txSig } }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const githubUsername = (session as any)?.githubUsername;
    const accessToken = session?.accessToken;

    if (!githubUsername || !accessToken) {
      return NextResponse.json(
        { error: 'Sign in with GitHub first' },
        { status: 401 },
      );
    }

    // Fetch GitHub stats
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${githubUsername}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(`https://api.github.com/users/${githubUsername}/events?per_page=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch GitHub profile' }, { status: 502 });
    }

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];

    const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);
    const pushEvents = events.filter((e: any) => e.type === 'PushEvent').length;

    const stats = {
      repos: user.public_repos || 0,
      followers: user.followers || 0,
      stars: totalStars,
      contributions: pushEvents,
    };

    const { score, tier } = calcTierAndScore(stats);

    // Create a deterministic wallet for this GitHub user
    // Use the GitHub issuer key + username as seed for the user's credential wallet
    const issuerKeypair = getGithubIssuerKeypair();
    const userSeed = Buffer.from(`github:${githubUsername}`);
    const [userPda] = PublicKey.findProgramAddressSync([userSeed], GLURK_PROGRAM_ID);

    // For the credential, we need a real wallet address.
    // If user has linked an email, use that wallet. Otherwise create a derived one.
    let userWallet: PublicKey;
    const userEmail = session?.user?.email;

    if (userEmail && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      const { data: link } = await supabase
        .from('identity_links')
        .select('wallet_address')
        .eq('email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (link?.wallet_address) {
        userWallet = new PublicKey(link.wallet_address);
      } else {
        // Generate a deterministic keypair for this GitHub user
        const seed = Buffer.alloc(32);
        const hash = Buffer.from(githubUsername);
        hash.copy(seed, 0, 0, Math.min(32, hash.length));
        userWallet = Keypair.fromSeed(seed).publicKey;

        // Auto-link this wallet to their email
        await supabase
          .from('identity_links')
          .upsert(
            { email: userEmail.toLowerCase().trim(), wallet_address: userWallet.toBase58() },
            { onConflict: 'email' },
          );
      }
    } else {
      // No email — derive a wallet from the username
      const seed = Buffer.alloc(32);
      const hash = Buffer.from(githubUsername);
      hash.copy(seed, 0, 0, Math.min(32, hash.length));
      userWallet = Keypair.fromSeed(seed).publicKey;
    }

    const slug = 'github-reputation';
    const connection = new Connection('https://api.devnet.solana.com', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 90_000,
    });

    // Check if credential already exists
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), issuerKeypair.publicKey.toBuffer(), userWallet.toBuffer(), Buffer.from(slug)],
      GLURK_PROGRAM_ID,
    );

    const existing = await connection.getAccountInfo(credentialPda);
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        credential: { slug, tier, score, credentialPda: credentialPda.toBase58() },
        github: { username: githubUsername, ...stats },
      });
    }

    // Mint Token-2022 non-transferable SBT
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const mintLen = getMintLen([ExtensionType.NonTransferable]);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const userAta = getAssociatedTokenAddressSync(
      mint, userWallet, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
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
      issuerKeypair.publicKey, userAta, userWallet, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ));
    mintTx.add(createMintToInstruction(mint, userAta, issuerKeypair.publicKey, 1, [], TOKEN_2022_PROGRAM_ID));

    await sendAndConfirmTransaction(connection, mintTx, [issuerKeypair, mintKeypair], {
      commitment: 'confirmed',
    });

    // Register credential on-chain
    const program = createSigningGlurkProgram(connection, issuerKeypair);
    const [issuerPda] = findIssuerPda(issuerKeypair.publicKey);

    const txSig = await program.methods
      .registerCredential(slug, tier, score, mint)
      .accounts({
        issuerAuthority: issuerKeypair.publicKey,
        issuerAccount: issuerPda,
        user: userWallet,
        credentialAccount: credentialPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .rpc();

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
      github: { username: githubUsername, ...stats },
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('github-credential error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
