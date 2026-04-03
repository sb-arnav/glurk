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
const ICON_URL = 'https://glurk.slayerblade.site/glurk-icon.svg';

const BLINKS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Content-Encoding,Accept-Encoding',
  'X-Action-Version': '2.1.3',
  'X-Blockchain-Ids': 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
};

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

// ── OPTIONS (CORS preflight) ──────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BLINKS_HEADERS });
}

// ── GET: Return action metadata ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const app = searchParams.get('app') || 'Unknown App';
  const contributeSlug = searchParams.get('contribute_slug') || 'general-data';
  const contributeTier = searchParams.get('contribute_tier') || 'bronze';
  const contributeScore = searchParams.get('contribute_score') || '75';

  const actionHref = `/api/actions/consent?app=${encodeURIComponent(app)}&contribute_slug=${encodeURIComponent(contributeSlug)}&contribute_tier=${encodeURIComponent(contributeTier)}&contribute_score=${encodeURIComponent(contributeScore)}`;

  const payload = {
    type: 'action' as const,
    title: `Grant access to ${app}`,
    icon: ICON_URL,
    description: `${app} wants to read your verified financial credentials. In return, it will contribute your ${contributeSlug.replace(/-/g, ' ')} to your Glurk profile.`,
    label: 'Approve',
    links: {
      actions: [
        {
          label: 'Approve Access',
          href: actionHref,
          type: 'transaction' as const,
        },
      ],
    },
  };

  return NextResponse.json(payload, { headers: BLINKS_HEADERS });
}

// ── POST: Build partial tx for Phantom to co-sign ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const app = searchParams.get('app') || 'Unknown App';
    const contributeSlug = searchParams.get('contribute_slug') || 'general-data';
    const contributeTier = searchParams.get('contribute_tier') || 'bronze';
    const contributeScore = parseInt(searchParams.get('contribute_score') || '75', 10);

    const body = await req.json();
    const userWallet = body.account;

    if (!userWallet) {
      return NextResponse.json(
        { message: 'Missing account in request body' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const authority = getAuthorityKeypair();

    let user: PublicKey;
    try {
      user = new PublicKey(userWallet);
    } catch {
      return NextResponse.json(
        { message: 'Invalid wallet address' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }

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
        Buffer.from(contributeSlug),
      ],
      PROGRAM_ID,
    );
    const [consentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), user.toBuffer(), authority.publicKey.toBuffer()],
      PROGRAM_ID,
    );

    // Check if consent already exists
    const existingConsent = await connection.getAccountInfo(consentPda);
    const existingContribution = await connection.getAccountInfo(contributionPda);

    if (existingConsent && existingContribution) {
      return NextResponse.json(
        { message: `You have already granted access to ${app}.` },
        { headers: BLINKS_HEADERS },
      );
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

    // Build the transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (program.methods as any)
      .requestAccess(
        contributeSlug,
        contributeTier,
        contributeScore,
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

    // Set blockhash and fee payer
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;

    // Partial sign with authority -- user (Phantom) must still sign
    tx.partialSign(authority);

    // Serialize allowing missing user signature
    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

    return NextResponse.json(
      {
        transaction: Buffer.from(serialized).toString('base64'),
        message: `Approving ${app} to read your credentials`,
      },
      { headers: BLINKS_HEADERS },
    );
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Blink consent action error:', err.message);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500, headers: BLINKS_HEADERS },
    );
  }
}
