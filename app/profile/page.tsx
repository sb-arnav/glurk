"use client";

import { useState } from "react";
import Link from "next/link";

// Demo profile — in production these come from reading all CredentialAccount PDAs for a wallet
const DEMO_PROFILE = {
  wallet: "AQEWftBuELL2vUHdwj7yYN3gMsRHbzJJjRGgdPyAQ8vN",
  name: "Arnav",
  glurkScore: 680,
  credentials: [
    {
      slug: "credit-score",
      name: "Credit Score Basics",
      tier: "gold",
      score: 78,
      issuer: "Staq",
      issuerAddress: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT",
      earnedAt: "2026-03-12",
    },
    {
      slug: "stocks",
      name: "Stock Market Basics",
      tier: "gold",
      score: 88,
      issuer: "Staq",
      issuerAddress: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT",
      earnedAt: "2026-03-18",
    },
    {
      slug: "upi",
      name: "UPI Payments",
      tier: "platinum",
      score: 95,
      issuer: "Staq",
      issuerAddress: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT",
      earnedAt: "2026-02-28",
    },
    {
      slug: "sell-rules",
      name: "Sell Rules",
      tier: "gold",
      score: 80,
      issuer: "Staq",
      issuerAddress: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT",
      earnedAt: "2026-03-22",
    },
    {
      slug: "trading-history",
      name: "Trading History",
      tier: "gold",
      score: 85,
      issuer: "StaqLend",
      issuerAddress: "D3moApp1111111111111111111111111111111111111",
      earnedAt: "2026-04-01",
    },
  ],
  accessGrants: [
    {
      app: "StaqLend",
      appIcon: "🏦",
      grantedAt: "2026-04-01",
      read: ["credit-score", "stocks", "upi", "sell-rules"],
      contributed: "trading-history",
      active: true,
    },
  ],
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

const TIER_BG: Record<string, string> = {
  platinum: "bg-white/[0.05] border-white/[0.1]",
  gold: "bg-yellow-500/[0.04] border-yellow-500/[0.1]",
  silver: "bg-white/[0.03] border-white/[0.06]",
  bronze: "bg-orange-900/[0.05] border-orange-800/[0.1]",
};

function ScoreArc({ score }: { score: number }) {
  const pct = score / 1000;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct * 0.75);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg
        viewBox="0 0 128 128"
        className="w-full h-full -rotate-[135deg]"
        fill="none"
      >
        <circle
          cx="64"
          cy="64"
          r={r}
          stroke="white"
          strokeOpacity="0.06"
          strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeLinecap="round"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          stroke="#10B981"
          strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black text-emerald-400">{score}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 -mt-0.5">
          Glurk
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const profile = DEMO_PROFILE;

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">
                G
              </div>
              <span className="text-sm font-semibold text-white/50">
                Glurk Protocol
              </span>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white/20">
              G
            </div>
            <h1 className="text-2xl font-black mb-2">Your Identity</h1>
            <p className="text-white/35 text-sm leading-relaxed mb-8">
              Connect your wallet to see all credentials across all apps,
              your Glurk Score, and which apps have access to your data.
            </p>
            <button
              onClick={() => setWalletConnected(true)}
              className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] transition-all flex items-center justify-center gap-3 group"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/40"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
              <span className="font-semibold text-[15px]">
                Connect Wallet
              </span>
            </button>
            <p className="text-[11px] text-white/15 mt-4">
              Demo mode — loads example profile for Arnav&apos;s wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">
              G
            </div>
            <span className="text-sm font-semibold text-white/50">
              Glurk Protocol
            </span>
          </Link>
          <button
            onClick={() => setWalletConnected(false)}
            className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-4)} ✕
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Identity card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center gap-6">
            <ScoreArc score={profile.glurkScore} />
            <div className="flex-1">
              <p className="text-xl font-black">{profile.name}</p>
              <p className="text-[11px] font-mono text-white/25 mt-0.5">
                {profile.wallet.slice(0, 12)}...{profile.wallet.slice(-6)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {profile.credentials.length} credentials
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30">
                  {new Set(profile.credentials.map((c) => c.issuer)).size} issuers
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30">
                  {profile.accessGrants.filter((g) => g.active).length} active apps
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Credentials
          </p>
          <div className="space-y-2">
            {profile.credentials.map((c) => (
              <div
                key={`${c.issuer}-${c.slug}`}
                className={`flex items-center justify-between py-3 px-4 rounded-xl border ${TIER_BG[c.tier]}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: TIER_COLORS[c.tier] }}
                  />
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-white/25">
                      {c.issuer} · {c.earnedAt}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TIER_COLORS[c.tier] }}
                  >
                    {c.tier}
                  </p>
                  <p className="text-xs text-white/30">{c.score}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access grants */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            App access
          </p>
          {profile.accessGrants.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <p className="text-sm text-white/25">No apps have accessed your data yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.accessGrants.map((grant) => (
                <div
                  key={grant.app}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{grant.appIcon}</span>
                      <div>
                        <p className="font-semibold text-sm">{grant.app}</p>
                        <p className="text-[11px] text-white/25">
                          Granted {grant.grantedAt}
                        </p>
                      </div>
                    </div>
                    {grant.active && (
                      <button
                        onClick={() => {
                          setRevoking(grant.app);
                          setTimeout(() => setRevoking(null), 1500);
                        }}
                        className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all ${
                          revoking === grant.app
                            ? "border-red-500/30 text-red-400 bg-red-500/[0.08]"
                            : "border-white/[0.08] text-white/30 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/[0.05]"
                        }`}
                      >
                        {revoking === grant.app ? "Revoking..." : "Revoke"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-white/25 mt-0.5 shrink-0">Read</span>
                      <div className="flex flex-wrap gap-1">
                        {grant.read.map((slug) => (
                          <span
                            key={slug}
                            className="font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/40"
                          >
                            {slug}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/25 shrink-0">Contributed</span>
                      <span className="font-mono px-1.5 py-0.5 rounded bg-blue-500/[0.06] border border-blue-500/[0.12] text-blue-400">
                        {grant.contributed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Try demo CTA */}
        <div className="rounded-2xl border border-emerald-500/[0.1] bg-emerald-500/[0.02] p-5">
          <p className="font-bold mb-1">Add more credentials</p>
          <p className="text-sm text-white/35 mb-4">
            Use apps built on Glurk Protocol. Each app that reads your profile
            must contribute data back — your identity grows automatically.
          </p>
          <Link
            href="/demo/lend"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Try StaqLend demo
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
