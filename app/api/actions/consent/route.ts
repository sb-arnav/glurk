import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import {
  createSigningGlurkProgram,
  findConsentPda,
  findContributionPda,
  findIssuerPda,
  getAuthorityKeypair,
  getGlurkConnection,
  GLURK_SYSTEM_PROGRAM_ID,
} from '@/lib/glurk-program';

export const dynamic = 'force-dynamic';

const ICON_URL = 'https://glurk.slayerblade.site/logo.png';

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
    const [contributionPda] = findContributionPda(authority.publicKey, user, contributeSlug);
    const [consentPda] = findConsentPda(user, authority.publicKey);

    const [existingConsent, existingContribution] = await Promise.all([
      connection.getAccountInfo(consentPda),
      connection.getAccountInfo(contributionPda),
    ]);

    if (existingConsent && existingContribution) {
      return NextResponse.json(
        { message: `You have already granted access to ${app}.` },
        { headers: BLINKS_HEADERS },
      );
    }

    const tx = await program.methods
      .requestAccess(
        contributeSlug,
        contributeTier,
        contributeScore,
      )
      .accounts({
        requesterAuthority: authority.publicKey,
        user,
        requesterIssuer: issuerPda,
        contributionAccount: contributionPda,
        consentAccount: consentPda,
        systemProgram: GLURK_SYSTEM_PROGRAM_ID,
      })
      .transaction();

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.partialSign(authority);

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
