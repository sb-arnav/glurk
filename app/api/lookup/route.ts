import { NextRequest, NextResponse } from 'next/server';
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
 * GET /api/lookup?email=user@example.com
 *
 * Looks up the wallet address linked to an email, then returns
 * their on-chain credentials via /api/credentials.
 *
 * This is the key API for app backends — they can check
 * "does this email have Glurk credentials?" without knowing
 * the user's wallet address.
 */
export async function GET(req: NextRequest) {
  const rawEmail = req.nextUrl.searchParams.get('email');
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  if (!email) {
    return NextResponse.json({ error: 'email param required' }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from('identity_links')
    .select('wallet_address')
    .eq('email', email)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'No wallet linked to this email' }, { status: 404 });
  }

  const profile = await getSerializedGlurkProfile(data.wallet_address);

  return NextResponse.json({
    email,
    wallet: data.wallet_address,
    credentials: profile.credentials,
    glurkScore: profile.glurkScore,
    consents: profile.consents,
  });
}
