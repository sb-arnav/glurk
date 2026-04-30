/**
 * Glurk test mode — Stripe-style deterministic fixtures.
 *
 * Sentinel wallets prefixed with `test:` short-circuit the chain read and
 * return a synthetic-but-shape-identical profile. Built so any integrator can
 * write CI tests for high-score / low-score / no-profile / threshold cases
 * without hunting for real wallets in those exact states.
 *
 * Contract: response shape matches the live endpoint exactly. Only difference
 * is the added `test: true` flag — your code can branch on that if needed,
 * or ignore it entirely. The `wallet` field echoes the sentinel verbatim.
 *
 * Stable: scenario names and their numeric outputs are part of the public
 * v1 API contract.
 */

export const TEST_WALLET_PREFIX = 'test:';

const STAQ_ISSUER = 'BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT';
const GITHUB_ISSUER = 'JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k';

export interface FixtureCredential {
  issuer: string;
  slug: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  score: number;
  timestamp: number;
  pda: string;
}

export interface Fixture {
  name: string;
  summary: string;
  glurkScore: number;
  credentials: FixtureCredential[];
}

// Frozen baseline timestamp — keeps fixture responses byte-identical across
// requests so snapshot tests don't drift. April 30 2026 UTC.
const T = 1746000000;

const fakePda = (scenario: string, slug: string) =>
  `test_pda_${scenario}_${slug}`;

export const FIXTURES: Record<string, Fixture> = {
  elite: {
    name: 'elite',
    summary:
      'Score 1000 — every issuer, every credential at platinum. Use to test maximum-benefit code paths.',
    glurkScore: 1000,
    credentials: [
      { issuer: STAQ_ISSUER, slug: 'credit-score', tier: 'platinum', score: 100, timestamp: T, pda: fakePda('elite', 'credit-score') },
      { issuer: STAQ_ISSUER, slug: 'investing-literacy', tier: 'platinum', score: 100, timestamp: T - 100, pda: fakePda('elite', 'investing-literacy') },
      { issuer: STAQ_ISSUER, slug: 'budgeting-mastery', tier: 'platinum', score: 100, timestamp: T - 200, pda: fakePda('elite', 'budgeting-mastery') },
      { issuer: GITHUB_ISSUER, slug: 'open-source-contributor', tier: 'platinum', score: 100, timestamp: T - 300, pda: fakePda('elite', 'open-source-contributor') },
      { issuer: GITHUB_ISSUER, slug: 'verified-developer', tier: 'platinum', score: 100, timestamp: T - 400, pda: fakePda('elite', 'verified-developer') },
    ],
  },
  approve: {
    name: 'approve',
    summary:
      'Score 600 — typical "approve with confidence" user. Mix of gold and silver, includes a Staq finlit credential.',
    glurkScore: 600,
    credentials: [
      { issuer: STAQ_ISSUER, slug: 'credit-score', tier: 'gold', score: 85, timestamp: T, pda: fakePda('approve', 'credit-score') },
      { issuer: STAQ_ISSUER, slug: 'investing-literacy', tier: 'silver', score: 70, timestamp: T - 100, pda: fakePda('approve', 'investing-literacy') },
      { issuer: GITHUB_ISSUER, slug: 'verified-developer', tier: 'gold', score: 80, timestamp: T - 200, pda: fakePda('approve', 'verified-developer') },
    ],
  },
  edge: {
    name: 'edge',
    summary:
      'Score exactly 300 — sits on the typical APPROVE/REJECT threshold. Use to test boundary conditions.',
    glurkScore: 300,
    credentials: [
      { issuer: STAQ_ISSUER, slug: 'credit-score', tier: 'silver', score: 60, timestamp: T, pda: fakePda('edge', 'credit-score') },
      { issuer: STAQ_ISSUER, slug: 'budgeting-mastery', tier: 'bronze', score: 50, timestamp: T - 100, pda: fakePda('edge', 'budgeting-mastery') },
    ],
  },
  reject: {
    name: 'reject',
    summary:
      'Score 120 — single bronze credential. Use to test reject / fall-back-to-KYC paths.',
    glurkScore: 120,
    credentials: [
      { issuer: STAQ_ISSUER, slug: 'budgeting-mastery', tier: 'bronze', score: 48, timestamp: T, pda: fakePda('reject', 'budgeting-mastery') },
    ],
  },
  empty: {
    name: 'empty',
    summary:
      'Score 0, no credentials, no issuers. Use to test the cold-start / no-profile UX (most new users land here).',
    glurkScore: 0,
    credentials: [],
  },
  'hire-ready': {
    name: 'hire-ready',
    summary:
      'GitHub-verified developer, no finlit signal. Use to test hiring/talent integrations that filter on GitHub-issued credentials only.',
    glurkScore: 175,
    credentials: [
      { issuer: GITHUB_ISSUER, slug: 'verified-developer', tier: 'gold', score: 88, timestamp: T, pda: fakePda('hire-ready', 'verified-developer') },
      { issuer: GITHUB_ISSUER, slug: 'open-source-contributor', tier: 'silver', score: 65, timestamp: T - 100, pda: fakePda('hire-ready', 'open-source-contributor') },
    ],
  },
};

/** Ordered list — used for docs and the playground chips. */
export const FIXTURE_ORDER = [
  'empty',
  'reject',
  'edge',
  'approve',
  'elite',
  'hire-ready',
] as const;

export function isTestWallet(wallet: string): boolean {
  return wallet.startsWith(TEST_WALLET_PREFIX);
}

/** Returns the fixture for a `test:*` sentinel, or null if the scenario is unknown. */
export function resolveFixture(wallet: string): Fixture | null {
  if (!isTestWallet(wallet)) return null;
  const scenario = wallet.slice(TEST_WALLET_PREFIX.length);
  return FIXTURES[scenario] ?? null;
}
