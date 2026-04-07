"use client";

import { useState, useEffect, useCallback } from "react";
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
type SeedResult = { slug: string; status: string };

function SeedPanel({ wallet, onDone }: { wallet: string; onDone: () => void }) {
  const [seeding, setSeeding] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setResults(data.results || []);
      setTimeout(onDone, 1200);
    } catch (e: unknown) {
      setError((e as Error).message);
      setSeeding(false);
    }
  }

  if (results.length > 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
        <p className="text-sm font-semibold text-emerald-400 mb-3">Credentials issued on devnet</p>
        <div className="space-y-1.5">
          {results.map((r) => (
            <div key={r.slug} className="flex items-center gap-2 text-xs text-white/50">
              <span className="text-emerald-400">{r.status === "issued" ? "✓" : "·"}</span>
              <span>{CREDENTIAL_NAMES[r.slug] || r.slug}</span>
              {r.status === "already_exists" && <span className="text-white/25">(already exists)</span>}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/25 mt-3">Loading your demo...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="font-semibold mb-1">No credentials found on devnet</p>
      <p className="text-sm text-white/35 leading-relaxed mb-5">
        This wallet has no Staq credentials on Solana devnet. Seed 4 demo credentials to see the full flow — each one mints a real Token-2022 SBT on-chain.
      </p>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2 mb-4">{error}</p>
      )}
      <button
        onClick={handleSeed}
        disabled={seeding}
        className="w-full py-3 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {seeding && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
          </svg>
        )}
        {seeding ? "Issuing on Solana devnet (~30s)..." : "Seed 4 demo credentials"}
      </button>
      <p className="text-[11px] text-white/15 mt-3 text-center">
        Issues real Token-2022 SBTs + Anchor PDAs on devnet
      </p>
    </div>
  );
}

function LendContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{
    score: number;
    wallet: string;
    txSig: string;
    credentials: Credential[];
  } | null>(null);

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
    const approved = searchParams.get("approved");
    const wallet = searchParams.get("wallet");
    if (approved !== "true" || !wallet) return;
    setConnected(true);
    loadCredentials(wallet, searchParams.get("txSig") || "");
  }, [searchParams, loadCredentials]);

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
        {!connected ? (
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Borrow smarter with <span className="text-[#5B4FE8]">verified skills.</span>
            </h1>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10">
              Your verified financial knowledge = lower collateral requirements.
              Connect your Glurk identity to unlock personalized rates.
            </p>

            <button
              onClick={handleSignIn}
              className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#5B4FE8]/20 border border-[#5B4FE8]/30 flex items-center justify-center text-sm font-black text-[#5B4FE8]">
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
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin w-6 h-6 text-white/20 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-white/25">Reading from Solana devnet...</p>
            </div>
          </div>
        ) : userData?.credentials.length === 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center text-sm font-bold text-[#5B4FE8]">G</div>
              <p className="font-mono text-sm text-white/50">{userData.wallet.slice(0, 8)}...{userData.wallet.slice(-4)}</p>
            </div>
            <SeedPanel
              wallet={userData.wallet}
              onDone={() => loadCredentials(userData.wallet, userData.txSig)}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center text-sm font-bold text-[#5B4FE8]">G</div>
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

            <div className="rounded-xl border border-[#5B4FE8]/[0.15] bg-[#5B4FE8]/[0.03] p-5 mb-4">
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

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white/20">Loading...</p></div>}>
      <LendContent />
    </Suspense>
  );
}
