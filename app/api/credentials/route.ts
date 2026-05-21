import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSerializedGlurkProfile } from '@/lib/glurk-profile';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json(await getSerializedGlurkProfile(userPubkey));
  } catch (e: unknown) {
    console.error('credentials API error:', e);
    return NextResponse.json(
      { error: 'failed to fetch credentials' },
      { status: 500 },
    );
  }
}
