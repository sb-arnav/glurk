"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CREDENTIAL_NAMES: Record<string, string> = {
  "credit-score": "Credit Score Basics",
  "stocks": "Stock Market Basics",
  "upi": "UPI Payments",
  "sell-rules": "Sell Rules",
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

type Credential = { slug: string; name: string; tier: string; score: number; issuer: string };

function LendContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{
    score: number;
    wallet: string;
    txSig: string;
    credentials: Credential[];
  } | null>(null);
  const approved = searchParams.get("approved") === "true";
  const callbackWallet = approved ? searchParams.get("wallet") : null;

  const loadCredentials = useCallback((wallet: string, txSig: string) => {
    setLoading(true);
    fetch(`/api/credentials?wallet=${wallet}`)
      .then((r) => r.json())
      .then((data) => {
        const creds = (data.credentials || []).map((c: { slug: string; tier: string; score: number; issuer: string }) => ({
          slug: c.slug,
          name: CREDENTIAL_NAMES[c.slug] || c.slug,
          tier: c.tier,
          score: c.score,
          issuer: c.issuer,
        }));
        setUserData({ score: data.glurkScore ?? 0, wallet, txSig, credentials: creds });
      })
      .catch(() => {
        setUserData({ score: 0, wallet, txSig, credentials: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!callbackWallet) return;
    queueMicrotask(() => {
      loadCredentials(callbackWallet, searchParams.get("txSig") || "");
    });
  }, [callbackWallet, loadCredentials, searchParams]);

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
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span className="font-bold text-lg">Staq<span className="text-[#5B4FE8]">Lend</span></span>
          </div>
          <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase px-2 py-1 border border-white/[0.06] rounded-md">Demo App</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {!callbackWallet ? (
          <div>
            <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
              DeFi Demo
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Borrow smarter with <span className="text-[#5B4FE8]">verified skills.</span>
            </h1>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10">
              Your verified financial knowledge = lower collateral requirements.
              Connect your Glurk identity to unlock personalized rates.
            </p>

            <button
              onClick={handleSignIn}
              className="w-full py-4 rounded-[24px] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.15] shadow-[0_18px_40px_rgba(6,5,18,0.22)] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#5B4FE8]/15 border border-[#5B4FE8]/25 flex items-center justify-center">
                <Image src="/glurk.png" alt="Glurk" width={22} height={22} />
              </div>
              <span className="font-semibold text-[15px]">Sign in with Glurk</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-center text-[11px] text-white/15 mt-4">
              Glurk reads your credentials and contributes trading data back. You approve everything.
            </p>

            <div className="mt-12 rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(5,4,18,0.32)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-mono tracking-widest uppercase text-white/25">Standard rates</p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/20">No identity</span>
              </div>
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
        ) : loading ? (
        <div className="flex items-center justify-center py-20">
            <div className="text-center rounded-[24px] border border-white/[0.08] bg-white/[0.04] px-8 py-10 shadow-[0_20px_48px_rgba(6,5,18,0.22)] backdrop-blur-xl">
              <svg className="animate-spin w-6 h-6 text-white/20 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-white/25">Reading from Solana devnet...</p>
            </div>
          </div>
        ) : userData?.credentials.length === 0 ? (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_20px_48px_rgba(6,5,18,0.22)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center">
                <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
              </div>
              <p className="font-mono text-sm text-white/50">{userData.wallet.slice(0, 8)}...{userData.wallet.slice(-4)}</p>
            </div>
            <p className="font-semibold mb-1">No credentials found</p>
            <p className="text-sm text-white/35 leading-relaxed mb-5">
              StaqLend uses your Glurk identity to personalize rates. Earn your first credentials on Staq, then come back to see what you unlock.
            </p>
            <a
              href="https://staq.slayerblade.site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/60 text-sm font-semibold hover:bg-white/[0.07] hover:text-white/80 transition-all"
            >
              Open Staq ↗
            </a>
          </div>
        ) : (
          <div>
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(5,4,18,0.32)] backdrop-blur-xl mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center">
                  <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
                </div>
                <div>
                  <p className="font-mono text-sm text-white/60">{userData?.wallet.slice(0, 8)}...{userData?.wallet.slice(-4)}</p>
                  {userData?.txSig && (
                    <a href={`https://explorer.solana.com/tx/${userData.txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#5B4FE8]/50 hover:text-[#5B4FE8] transition-colors">
                      consent tx ↗
                    </a>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-black text-[#5B4FE8]">{userData?.score}</p>
                  <p className="text-[10px] text-white/25 font-mono">GLURK SCORE</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Collateral</p>
                  <p className="mt-1 text-sm font-semibold text-[#A79EFF]">{yourCollateral}%</p>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Savings</p>
                  <p className="mt-1 text-sm font-semibold text-white/70">{collateralSavings}%</p>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Rate</p>
                  <p className="mt-1 text-sm font-semibold text-blue-300">8.2%</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5 mb-4 shadow-[0_18px_40px_rgba(6,5,18,0.22)]">
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

            <div className="rounded-[24px] border border-[#5B4FE8]/[0.15] bg-[#5B4FE8]/[0.05] p-5 mb-4 shadow-[0_20px_48px_rgba(91,79,232,0.14)]">
              <p className="text-[10px] font-mono tracking-widest uppercase text-[#5B4FE8]/50 mb-4">Your personalized rates</p>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/40">Standard collateral</span>
                <span className="text-lg font-bold text-white/25 line-through">150%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/60">Your collateral</span>
                <span className="text-2xl font-black text-[#5B4FE8]">{yourCollateral}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-white/40">Interest rate</span>
                <span className="text-xl font-black text-[#5B4FE8]">8.2%</span>
              </div>
              <div className="mt-3 py-2 px-3 rounded-lg bg-[#5B4FE8]/[0.08] border border-[#5B4FE8]/[0.12]">
                <p className="text-xs font-semibold text-[#5B4FE8]">
                  You save {collateralSavings}% collateral because of your verified financial knowledge
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(6,5,18,0.22)]">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">Data exchange</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[#5B4FE8] text-sm">←</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] px-8 py-6 shadow-[0_20px_48px_rgba(6,5,18,0.22)] backdrop-blur-xl"><p className="text-white/20">Loading...</p></div></div>}>
      <LendContent />
    </Suspense>
  );
}
