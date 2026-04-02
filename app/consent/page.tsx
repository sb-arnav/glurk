"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// Mock user credentials (in production, read from Solana via wallet)
const USER_CREDENTIALS = [
  { slug: "credit-score", name: "Credit Score", tier: "gold", score: 78, issuer: "Staq" },
  { slug: "stocks", name: "Stock Market Basics", tier: "gold", score: 88, issuer: "Staq" },
  { slug: "upi", name: "UPI Payments", tier: "platinum", score: 95, issuer: "Staq" },
  { slug: "sell-rules", name: "Sell Rules", tier: "gold", score: 80, issuer: "Staq" },
];

const USER = {
  name: "Arnav",
  wallet: "AQEWftBuELL2vUHdwj7yYN3gMsRHbzJJjRGgdPyAQ8vN",
  glurkScore: 680,
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [approved, setApproved] = useState(false);
  const [denied, setDenied] = useState(false);

  const appName = searchParams.get("app") || "Unknown App";
  const appIcon = searchParams.get("icon") || "🏦";
  const requestedFields = (searchParams.get("fields") || "credit-score,stocks").split(",");
  const contributionSlug = searchParams.get("contribute_slug") || "trading-history";
  const contributionName = searchParams.get("contribute_name") || "Trading History";
  const contributionTier = searchParams.get("contribute_tier") || "gold";
  const callbackUrl = searchParams.get("callback") || "/demo/lend";

  const requestedCredentials = USER_CREDENTIALS.filter((c) =>
    requestedFields.includes(c.slug)
  );

  const handleApprove = () => {
    setApproved(true);
    setTimeout(() => {
      const params = new URLSearchParams({
        approved: "true",
        score: String(USER.glurkScore),
        credentials: JSON.stringify(requestedCredentials),
        wallet: USER.wallet,
        name: USER.name,
      });
      router.push(`${callbackUrl}?${params.toString()}`);
    }, 1200);
  };

  const handleDeny = () => {
    setDenied(true);
    setTimeout(() => {
      router.push(`${callbackUrl}?approved=false`);
    }, 800);
  };

  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-lg font-bold">Access Granted</p>
          <p className="text-sm text-white/30 mt-1">Redirecting to {appName}...</p>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg font-bold">Access Denied</p>
          <p className="text-sm text-white/30 mt-1">Redirecting back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
            G
          </div>
          <p className="text-xs text-white/30 font-mono tracking-widest uppercase">Glurk Protocol</p>
        </div>

        {/* Consent Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          {/* App requesting */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                {appIcon}
              </div>
              <div>
                <p className="font-bold text-[15px]">{appName}</p>
                <p className="text-xs text-white/30">wants to access your identity</p>
              </div>
            </div>
          </div>

          {/* What they want to read */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">Will read</p>
            <div className="space-y-2">
              {requestedCredentials.map((c) => (
                <div key={c.slug} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-white/30">{c.issuer}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TIER_COLORS[c.tier] }}>
                    {c.tier}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08]">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Glurk Score</p>
                  <p className="text-[11px] text-white/30">Reputation</p>
                </div>
                <span className="text-lg font-black text-emerald-400">{USER.glurkScore}</span>
              </div>
            </div>
          </div>

          {/* What they'll contribute */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">Will contribute to your profile</p>
            <div className="py-2 px-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-400">{contributionName}</p>
                  <p className="text-[11px] text-white/30">From {appName}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {contributionTier}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-white/20 mt-3 leading-relaxed">
              This app must contribute data to access yours. Your identity gets richer with every connection.
            </p>
          </div>

          {/* User identity */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">Signed in as</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                {USER.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{USER.name}</p>
                <p className="text-[11px] font-mono text-white/25">{USER.wallet.slice(0, 8)}...{USER.wallet.slice(-4)}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-6 flex gap-3">
            <button
              onClick={handleDeny}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-semibold text-white/50 hover:bg-white/[0.05] hover:text-white/70 transition-all"
            >
              Deny
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition-all"
            >
              Approve
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-6">
          Credentials verified on Solana. You control your data.
        </p>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white/20">Loading...</p></div>}>
      <ConsentContent />
    </Suspense>
  );
}
