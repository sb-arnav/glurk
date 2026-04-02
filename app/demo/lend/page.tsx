"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LendContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    score: number;
    wallet: string;
    credentials: { slug: string; name: string; tier: string; score: number; issuer: string }[];
  } | null>(null);

  useEffect(() => {
    const approved = searchParams.get("approved");
    if (approved === "true") {
      setConnected(true);
      setUserData({
        name: searchParams.get("name") || "User",
        score: Number(searchParams.get("score")) || 0,
        wallet: searchParams.get("wallet") || "",
        credentials: JSON.parse(searchParams.get("credentials") || "[]"),
      });
    }
  }, [searchParams]);

  const TIER_COLORS: Record<string, string> = {
    platinum: "#E5E4E2",
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
  };

  const collateralSavings = userData ? Math.round((userData.score / 1000) * 55) : 0;
  const yourCollateral = 150 - collateralSavings;

  const handleSignIn = () => {
    const params = new URLSearchParams({
      app: "StaqLend",
      icon: "🏦",
      fields: "credit-score,stocks,upi,sell-rules",
      contribute_slug: "trading-history",
      contribute_name: "Trading History",
      contribute_tier: "gold",
      callback: "/demo/lend",
    });
    window.location.href = `/consent?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      {/* App header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span className="font-bold text-lg">Staq<span className="text-emerald-400">Lend</span></span>
          </div>
          <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase px-2 py-1 border border-white/[0.06] rounded-md">Demo App</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {!connected ? (
          /* Pre-connection state */
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Borrow smarter with <span className="text-emerald-400">verified skills.</span>
            </h1>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10">
              Your verified financial knowledge = lower collateral requirements.
              Connect your Glurk identity to unlock personalized rates.
            </p>

            <button
              onClick={handleSignIn}
              className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-black">
                G
              </div>
              <span className="font-semibold text-[15px]">Sign in with Glurk</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-center text-[11px] text-white/15 mt-4">
              Glurk reads your credentials and contributes trading data back. You approve everything.
            </p>

            {/* Standard rates */}
            <div className="mt-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-4">Standard rates (no identity)</p>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/40">Collateral required</span>
                <span className="text-xl font-black text-white/60">150%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-white/40">Interest rate</span>
                <span className="text-xl font-black text-white/60">12.5%</span>
              </div>
              <p className="text-[11px] text-white/15 mt-3">Connect Glurk to unlock better terms based on your verified knowledge.</p>
            </div>
          </div>
        ) : (
          /* Connected state */
          <div>
            {/* User header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                {userData?.name[0]}
              </div>
              <div>
                <p className="font-bold">{userData?.name}</p>
                <p className="text-[11px] font-mono text-white/25">{userData?.wallet.slice(0, 8)}...{userData?.wallet.slice(-4)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-black text-emerald-400">{userData?.score}</p>
                <p className="text-[10px] text-white/25 font-mono">GLURK SCORE</p>
              </div>
            </div>

            {/* Credentials received */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-4">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">Credentials received via Glurk</p>
              <div className="space-y-2">
                {userData?.credentials.map((c) => (
                  <div key={c.slug} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[c.tier] }} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase" style={{ color: TIER_COLORS[c.tier] }}>{c.tier}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Your personalized rates */}
            <div className="rounded-xl border border-emerald-500/[0.15] bg-emerald-500/[0.03] p-5 mb-4">
              <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/50 mb-4">Your personalized rates</p>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/40">Standard collateral</span>
                <span className="text-lg font-bold text-white/25 line-through">150%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/60">Your collateral</span>
                <span className="text-2xl font-black text-emerald-400">{yourCollateral}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-white/40">Interest rate</span>
                <span className="text-xl font-black text-emerald-400">8.2%</span>
              </div>
              <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.12]">
                <p className="text-xs font-semibold text-emerald-400">
                  You save {collateralSavings}% collateral because of your verified financial knowledge
                </p>
              </div>
            </div>

            {/* Data exchange proof */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">Data exchange</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-emerald-400 text-sm">←</span>
                  <span className="text-xs text-white/40"><span className="text-white/60 font-semibold">Read:</span> {userData?.credentials.length} credentials + Glurk Score</span>
                </div>
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-blue-500/[0.03] border border-blue-500/[0.08]">
                  <span className="text-blue-400 text-sm">→</span>
                  <span className="text-xs text-white/40"><span className="text-blue-400 font-semibold">Contributed:</span> Trading History (Gold tier)</span>
                </div>
              </div>
              <p className="text-[11px] text-white/15 mt-3">
                StaqLend contributed trading data back to your Glurk identity. Your profile is now richer for the next app.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LendPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white/20">Loading...</p></div>}>
      <LendContent />
    </Suspense>
  );
}
