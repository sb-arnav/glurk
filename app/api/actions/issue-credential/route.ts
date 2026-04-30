import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createSigningGlurkProgram,
  findCredentialPda,
  findIssuerPda,
  getAuthorityKeypair,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

const ICON_URL = 'https://glurk.slayerblade.site/logo.png';

// Protocol-native credential. Glurk itself is the issuer of "you were here early."
// No query-param customization — that would let anyone self-mint arbitrary
// credentials and rug the entire premise of verifiable issuance.
const EARLY_ADOPTER_CREDENTIAL = {
  slug: 'early-adopter',
  tier: 'founding',
  score: 1, // intrinsic credential — value is binary, not numeric
} as const;

const BLINKS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Content-Encoding,Accept-Encoding',
  'X-Action-Version': '2.1.3',
  'X-Blockchain-Ids': 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BLINKS_HEADERS });
}

export async function GET() {
  const payload = {
    type: 'action' as const,
    title: 'Glurk Early Adopter',
    icon: ICON_URL,
    description:
      'Mint a non-transferable Early Adopter credential to your wallet. Issued by Glurk Protocol to wallets that interact during the founding period. Permanent, on-chain, verifiable by any app.',
    label: 'Mint Early Adopter',
    links: {
      actions: [
        {
          label: 'MINT TO WALLET',
          href: '/api/actions/issue-credential',
          type: 'transaction' as const,
        },
      ],
    },
  };

  return NextResponse.json(payload, { headers: BLINKS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { slug: credentialSlug, tier, score } = EARLY_ADOPTER_CREDENTIAL;

    const body = await req.json();
    const userWallet = body.account;

    if (!userWallet) {
      return NextResponse.json(
        { message: 'Missing account in request body' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }

    const connection = getGlurkConnection();
    const authority = getAuthorityKeypair();
    const program = createSigningGlurkProgram(connection, authority);

    let user: PublicKey;
    try {
      user = new PublicKey(userWallet);
    } catch {
      return NextResponse.json(
        { message: 'Invalid wallet address' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }

    const [issuerPda] = findIssuerPda(authority.publicKey);
    const [credentialPda] = findCredentialPda(authority.publicKey, user, credentialSlug);

    const existingCredential = await connection.getAccountInfo(credentialPda);
    if (existingCredential) {
      return NextResponse.json(
        { message: `You have already claimed the ${credentialSlug} credential.` },
        { headers: BLINKS_HEADERS },
      );
    }

    const tx = await program.methods
      .registerCredential(
        credentialSlug,
        tier,
        score,
        PublicKey.default,
      )
      .accounts({
        issuerAuthority: authority.publicKey,
        user,
        issuerAccount: issuerPda,
        credentialAccount: credentialPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .transaction();

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    
    // Set fee payer to the user consuming the action
    tx.feePayer = user;
    tx.partialSign(authority);

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

    return NextResponse.json(
      {
        transaction: Buffer.from(serialized).toString('base64'),
        message: `Minting ${credentialSlug} credential`,
      },
      { headers: BLINKS_HEADERS },
    );
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Blink issue-credential action error:', err.message);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500, headers: BLINKS_HEADERS },
    );
  }
}
