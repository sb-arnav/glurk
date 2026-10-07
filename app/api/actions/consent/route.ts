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

// Mirror the limits in /api/consent (chain-side max_len on CredentialAccount).
const MAX_SLUG_LEN = 64;
const ALLOWED_TIERS = new Set(['platinum', 'gold', 'silver', 'bronze']);

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
    const contributeScoreRaw = searchParams.get('contribute_score') || '75';
    const contributeScore = /^\d{1,3}$/.test(contributeScoreRaw) ? Number(contributeScoreRaw) : NaN;

    if (!Number.isInteger(contributeScore) || contributeScore < 0 || contributeScore > 100) {
      return NextResponse.json(
        { message: 'Invalid contribute_score (integer 0-100)' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }
    if (!ALLOWED_TIERS.has(contributeTier)) {
      return NextResponse.json(
        { message: 'Invalid contribute_tier' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }
    if (!contributeSlug || Buffer.byteLength(contributeSlug, 'utf8') > MAX_SLUG_LEN) {
      return NextResponse.json(
        { message: `Invalid contribute_slug (max ${MAX_SLUG_LEN} bytes)` },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }

    let body: { account?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON body' },
        { status: 400, headers: BLINKS_HEADERS },
      );
    }
    const userWallet = body?.account;

    if (typeof userWallet !== 'string' || !userWallet) {
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

    // ConsentAccount layout: 8 discriminator + 32 user + 32 requester + 8 granted_at + 1 active.
    // A revoked consent must fall through so the user can re-grant.
    const consentIsActive =
      !!existingConsent && existingConsent.data.length >= 81 && existingConsent.data[80] === 1;

    if (consentIsActive && existingContribution) {
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
    console.error('Blink consent action error:', e);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: BLINKS_HEADERS },
    );
  }
}
