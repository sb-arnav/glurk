import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const RPC_URL = 'https://api.devnet.solana.com';

const CREDENTIAL_DISCRIMINATOR = Buffer.from([163, 33, 82, 244, 191, 35, 220, 78]);
const CONSENT_DISCRIMINATOR = Buffer.from([129, 26, 32, 122, 68, 134, 146, 154]);

const TIER_WEIGHTS: Record<string, number> = {
  platinum: 100,
  gold: 75,
  silver: 50,
  bronze: 25,
};

function parseCredential(pubkey: string, data: Buffer) {
  try {
    if (!data.slice(0, 8).equals(CREDENTIAL_DISCRIMINATOR)) return null;

    let offset = 8;
    const issuer = new PublicKey(data.slice(offset, offset + 32)).toBase58(); offset += 32;
    const user = new PublicKey(data.slice(offset, offset + 32)).toBase58(); offset += 32;

    const slugLen = data.readUInt32LE(offset); offset += 4;
    const slug = data.slice(offset, offset + slugLen).toString('utf8'); offset += slugLen;

    const tierLen = data.readUInt32LE(offset); offset += 4;
    const tier = data.slice(offset, offset + tierLen).toString('utf8'); offset += tierLen;

    const score = data.readUInt8(offset); offset += 1;
    offset += 32; // mint_address
    const timestamp = Number(data.readBigInt64LE(offset));

    return { pubkey, issuer, user, slug, tier, score, timestamp };
  } catch {
    return null;
  }
}

function parseConsent(pubkey: string, data: Buffer) {
  try {
    if (!data.slice(0, 8).equals(CONSENT_DISCRIMINATOR)) return null;

    let offset = 8;
    const user = new PublicKey(data.slice(offset, offset + 32)).toBase58(); offset += 32;
    const requester = new PublicKey(data.slice(offset, offset + 32)).toBase58(); offset += 32;
    const grantedAt = Number(data.readBigInt64LE(offset)); offset += 8;
    const active = data.readUInt8(offset) === 1;

    return { pubkey, user, requester, grantedAt, active };
  } catch {
    return null;
  }
}

function calcScore(credentials: ReturnType<typeof parseCredential>[]) {
  let total = 0;
  for (const cred of credentials) {
    if (!cred) continue;
    const tierWeight = TIER_WEIGHTS[cred.tier] ?? 25;
    const scoreWeight = (cred.score ?? 0) / 100;
    total += tierWeight * scoreWeight;
  }
  return Math.min(1000, Math.round(total));
}

/**
 * GET /api/credentials?wallet=<base58>
 *
 * Reads all CredentialAccount PDAs where user == wallet from devnet.
 * Also reads ConsentAccounts to show which apps have access.
 *
 * Returns: {
 *   credentials: Credential[],
 *   consents: Consent[],
 *   glurkScore: number,
 * }
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 });
  }

  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
  }

  try {
    const connection = new Connection(RPC_URL, 'confirmed');

    // Fetch credential accounts where user = wallet (offset 40 = 8 discriminator + 32 issuer)
    const credAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: CREDENTIAL_DISCRIMINATOR.toString('base64'),
            encoding: 'base64' as const,
          },
        },
        {
          memcmp: {
            offset: 40,
            bytes: userPubkey.toBase58(),
          },
        },
      ],
    });

    // Fetch consent accounts where user = wallet (offset 8)
    const consentAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: CONSENT_DISCRIMINATOR.toString('base64'),
            encoding: 'base64' as const,
          },
        },
        {
          memcmp: {
            offset: 8,
            bytes: userPubkey.toBase58(),
          },
        },
      ],
    });

    const credentials = credAccounts
      .map((a) => parseCredential(a.pubkey.toBase58(), Buffer.from(a.account.data)))
      .filter(Boolean);

    const consents = consentAccounts
      .map((a) => parseConsent(a.pubkey.toBase58(), Buffer.from(a.account.data)))
      .filter(Boolean);

    const glurkScore = calcScore(credentials);

    return NextResponse.json({ credentials, consents, glurkScore });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('credentials API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
