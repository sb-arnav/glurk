import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * GET /api/auth/me
 *
 * Returns the current Google session + linked wallet + on-chain credentials.
 * Called by the profile page on mount if the user is signed in with Google.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false });
  }

  const { data } = await getSupabase()
    .from('identity_links')
    .select('wallet_address')
    .eq('email', session.user.email)
    .single();

  if (!data?.wallet_address) {
    return NextResponse.json({
      authenticated: true,
      email: session.user.email,
      wallet: null,
      credentials: [],
      glurkScore: 0,
    });
  }

  const credUrl = new URL('/api/credentials', req.url);
  credUrl.searchParams.set('wallet', data.wallet_address);
  const credRes = await fetch(credUrl.toString());
  const credData = await credRes.json();

  return NextResponse.json({
    authenticated: true,
    email: session.user.email,
    wallet: data.wallet_address,
    credentials: credData.credentials ?? [],
    glurkScore: credData.glurkScore ?? 0,
    consents: credData.consents ?? [],
  });
}
