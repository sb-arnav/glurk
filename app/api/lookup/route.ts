import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const email = req.nextUrl.searchParams.get('email');
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

  // Fetch credentials from the on-chain API
  const credUrl = new URL('/api/credentials', req.url);
  credUrl.searchParams.set('wallet', data.wallet_address);

  const credRes = await fetch(credUrl.toString());
  const credData = await credRes.json();

  return NextResponse.json({
    email,
    wallet: data.wallet_address,
    credentials: credData.credentials ?? [],
    glurkScore: credData.glurkScore ?? 0,
    consents: credData.consents ?? [],
  });
}
