import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { getSerializedGlurkProfile, normalizeEmail } from '@/lib/glurk-profile';

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
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false });
  }

  const email = normalizeEmail(session.user.email);

  const { data } = await getSupabase()
    .from('identity_links')
    .select('wallet_address')
    .eq('email', email)
    .single();

  if (!data?.wallet_address) {
    return NextResponse.json({
      authenticated: true,
      email,
      wallet: null,
      credentials: [],
      glurkScore: 0,
      consents: [],
    });
  }

  const profile = await getSerializedGlurkProfile(data.wallet_address);

  return NextResponse.json({
    authenticated: true,
    email,
    wallet: data.wallet_address,
    credentials: profile.credentials,
    glurkScore: profile.glurkScore,
    consents: profile.consents,
  });
}
