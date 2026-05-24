import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';
import { normalizeEmail } from '@/lib/glurk-profile';
import { verifyAuthMessage } from '@/lib/wallet-auth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const email = normalizeEmail(session.user.email);

  const { wallet, message, signature } = await req.json();
  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Email is proven by the session; the wallet must be proven by a signature so a
  // user can't bind their email to a wallet (and its on-chain reputation) they
  // don't control. Wallet is derived from the signed message.
  const auth = verifyAuthMessage({
    message: message ?? '',
    signature: signature ?? '',
    expectedPurpose: 'link-wallet',
    expectedWallet: wallet,
  });
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error || 'wallet ownership signature required' },
      { status: 401 },
    );
  }

  const { error } = await getSupabase()
    .from('identity_links')
    .upsert({ email, wallet_address: wallet }, { onConflict: 'email' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email, wallet });
}
