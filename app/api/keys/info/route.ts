import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readApiKey, hashApiKey, type ApiKeyRecord } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

const HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Glurk-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

/**
 * GET /api/keys/info?key=glk_xxx
 *
 * Self-serve usage view for an API key holder. Possession of the key
 * is the credential — same model as the read endpoint. Lets paying
 * customers see their quota / reset date / last-used without having
 * to email support.
 *
 * Returns redacted view: email is masked, key shows first8...last4
 * only. Both are still recognizable to the owner without leaking
 * full identifiers if the URL is shared accidentally.
 *
 * No tracking: this lookup does NOT increment monthly_used. It's a
 * meta read, not a billable API call.
 */

interface InfoResponse {
  ok: true;
  keyPreview: string;
  emailMasked: string;
  tier: string;
  active: boolean;
  monthlyQuota: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  monthlyPercentUsed: number;
  resetAt: string;
  daysUntilReset: number;
  totalCalls: number;
  lastUsedAt: string | null;
  createdAt: string;
  appName: string | null;
  paddle: {
    linked: boolean;
    status: string | null;
  };
}

interface InfoError {
  ok: false;
  error: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function daysBetween(future: Date, now: Date): number {
  const ms = future.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function nextMonthlyReset(): Date {
  // Quotas reset on the 1st of each month UTC — match consumeApiKey().
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  const key = readApiKey(req, req.nextUrl) ?? req.nextUrl.searchParams.get('key');

  if (!key) {
    const err: InfoError = {
      ok: false,
      error: 'pass your key as ?key=glk_xxx, X-Glurk-Api-Key header, or Bearer token',
    };
    return NextResponse.json(err, { status: 400, headers: HEADERS });
  }
  if (!key.startsWith('glk_')) {
    const err: InfoError = { ok: false, error: 'invalid key format (expected glk_…)' };
    return NextResponse.json(err, { status: 400, headers: HEADERS });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    const err: InfoError = { ok: false, error: 'service not configured' };
    return NextResponse.json(err, { status: 500, headers: HEADERS });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', hashApiKey(key))
    .maybeSingle();

  if (error) {
    const err: InfoError = { ok: false, error: 'lookup failed' };
    return NextResponse.json(err, { status: 500, headers: HEADERS });
  }
  if (!data) {
    const err: InfoError = { ok: false, error: 'no key found — check for typos' };
    return NextResponse.json(err, { status: 404, headers: HEADERS });
  }

  const record = data as ApiKeyRecord & {
    paddle_subscription_id?: string | null;
    paddle_status?: string | null;
  };

  const reset = nextMonthlyReset();
  const now = new Date();
  const monthlyUsed = record.monthly_used ?? 0;
  const monthlyQuota = record.monthly_quota;
  const monthlyRemaining = Math.max(0, monthlyQuota - monthlyUsed);
  const percent =
    monthlyQuota > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyQuota) * 100)) : 0;

  const body: InfoResponse = {
    ok: true,
    keyPreview: record.key_preview ?? 'glk_***',
    emailMasked: maskEmail(record.owner_email),
    tier: record.tier,
    active: !record.deactivated_at,
    monthlyQuota,
    monthlyUsed,
    monthlyRemaining,
    monthlyPercentUsed: percent,
    resetAt: reset.toISOString(),
    daysUntilReset: daysBetween(reset, now),
    totalCalls: Number(record.total_calls ?? 0),
    lastUsedAt: record.last_used_at,
    createdAt: record.created_at,
    appName: record.app_name,
    paddle: {
      linked: Boolean(record.paddle_subscription_id),
      status: record.paddle_status ?? null,
    },
  };

  return NextResponse.json(body, { headers: HEADERS });
}
