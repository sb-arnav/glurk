import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';
// Cache for 60 s — devnet is slow, no need to hammer it
export const revalidate = 60;

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const RPC_URL = 'https://api.devnet.solana.com';

const CREDENTIAL_DISCRIMINATOR = Buffer.from([163, 33, 82, 244, 191, 35, 220, 78]);
const CONSENT_DISCRIMINATOR = Buffer.from([129, 26, 32, 122, 68, 134, 146, 154]);

/**
 * GET /api/stats
 *
 * Returns total credential PDAs and consent PDAs on devnet.
 * Used by the homepage to show live proof of on-chain activity.
 */
export async function GET() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');

    const [credAccounts, consentAccounts] = await Promise.all([
      connection.getProgramAccounts(PROGRAM_ID, {
        dataSlice: { offset: 0, length: 0 },
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: CREDENTIAL_DISCRIMINATOR.toString('base64'),
              encoding: 'base64' as const,
            },
          },
        ],
      }),
      connection.getProgramAccounts(PROGRAM_ID, {
        dataSlice: { offset: 0, length: 0 },
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: CONSENT_DISCRIMINATOR.toString('base64'),
              encoding: 'base64' as const,
            },
          },
        ],
      }),
    ]);

    return NextResponse.json({
      credentials: credAccounts.length,
      consents: consentAccounts.length,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
