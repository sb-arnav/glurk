"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

type CredentialResult = {
  ok: boolean;
  alreadyExists?: boolean;
  credential: {
    slug: string;
    tier: string;
    score: number;
    txSig?: string;
    credentialPda: string;
  };
  stats: {
    txCount: number;
    solBalance: number;
    tokenAccounts: number;
    accountAge: number;
  };
};

export default function ConnectSolanaPage() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<CredentialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connectPhantom() {
    if (!(window as any).solana?.isPhantom) {
      setError("Phantom wallet not found. Install it at phantom.app");
      return;
    }
    try {
      const resp = await (window as any).solana.connect();
      setWallet(resp.publicKey.toBase58());
    } catch {
      setError("Wallet connection cancelled.");
    }
  }

  async function claimCredential() {
    if (!wallet) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/solana-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          email: session?.user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue credential");
      setResult(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
            <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
          </Link>
          <Link href="/connect" className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors">
            ← All sources
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {result ? (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl font-black"
                style={{
                  background: `${TIER_COLORS[result.credential.tier]}15`,
                  border: `2px solid ${TIER_COLORS[result.credential.tier]}40`,
                  color: TIER_COLORS[result.credential.tier],
                }}
              >
                {result.credential.score}
              </div>
              <p className="text-lg font-bold mb-1">
                {result.alreadyExists ? "Credential already issued" : "Credential issued"}
              </p>
              <p className="text-sm text-white/40 mb-5">
                Solana on-chain activity ·{" "}
                <span style={{ color: TIER_COLORS[result.credential.tier] }} className="font-bold uppercase text-xs">
                  {result.credential.tier}
                </span>
              </p>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { label: "Txns", value: result.stats.txCount },
                  { label: "SOL", value: result.stats.solBalance.toFixed(1) },
                  { label: "Tokens", value: result.stats.tokenAccounts },
                  { label: "Days", value: result.stats.accountAge },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-white/[0.05] bg-black/20 px-2 py-2.5 text-center">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">{label}</p>
                    <p className="text-sm font-semibold text-white/70 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {result.credential.txSig && (
                <a
                  href={`https://explorer.solana.com/tx/${result.credential.txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-[#7B6FF8]/60 hover:text-[#7B6FF8] transition-colors block mb-5"
                >
                  {result.credential.txSig.slice(0, 20)}... on Solana ↗
                </a>
              )}

              <div className="flex gap-3">
                <Link href="/profile" className="flex-1 py-3 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors text-center">
                  View Profile
                </Link>
                <Link href="/connect" className="flex-1 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white/60 text-sm font-semibold hover:bg-white/[0.06] transition-colors text-center">
                  More Sources
                </Link>
              </div>
            </div>
          ) : wallet ? (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 397.7 311.7" fill="none">
                  <linearGradient id="sol-b" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
                    <stop offset="0" stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <path fill="url(#sol-b)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                  <path fill="url(#sol-b)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                  <path fill="url(#sol-b)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                </svg>
              </div>
              <span className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40 mb-4">
                Connected
              </span>
              <p className="font-mono text-sm text-white/50 mb-1">{wallet.slice(0, 8)}...{wallet.slice(-6)}</p>
              <p className="text-sm text-white/30 mb-6 leading-relaxed">
                We&apos;ll read your mainnet activity — transactions, SOL balance, token accounts, and account age — to calculate your on-chain reputation score.
              </p>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <button
                onClick={claimCredential}
                disabled={claiming}
                className="w-full py-4 rounded-2xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {claiming && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                )}
                {claiming ? "Analyzing + issuing on-chain..." : "Claim Solana activity credential"}
              </button>
              <p className="text-[11px] text-white/15 mt-3">Reads mainnet. Issues credential on devnet.</p>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 397.7 311.7" fill="none" opacity="0.3">
                  <linearGradient id="sol-c" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
                    <stop offset="0" stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <path fill="url(#sol-c)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                  <path fill="url(#sol-c)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                  <path fill="url(#sol-c)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                </svg>
              </div>
              <span className="inline-flex rounded-full border border-[#14F195]/20 bg-[#14F195]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#14F195]/70 mb-5">
                On-Chain Activity
              </span>
              <h1 className="text-2xl font-black mb-2">Verify your Solana reputation</h1>
              <p className="text-sm text-white/35 leading-relaxed mb-6">
                Connect your wallet to get a credential based on your real mainnet activity —
                transactions, holdings, token accounts, and account age. No OAuth, no signups.
              </p>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <button
                onClick={connectPhantom}
                className="w-full py-4 rounded-2xl bg-[#AB9FF2]/10 border border-[#AB9FF2]/25 hover:bg-[#AB9FF2]/15 hover:border-[#AB9FF2]/40 transition-all flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
                  <rect width="128" height="128" rx="28" fill="#AB9FF2" />
                  <ellipse cx="64" cy="65" rx="42" ry="42" fill="white" />
                  <circle cx="53" cy="58" r="10" fill="#AB9FF2" />
                  <circle cx="75" cy="58" r="10" fill="#AB9FF2" />
                  <circle cx="50" cy="57" r="3.5" fill="white" />
                  <circle cx="72" cy="57" r="3.5" fill="white" />
                </svg>
                <span className="font-semibold text-[15px]">Connect Phantom</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste any Solana wallet address"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value.trim())}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white/70 placeholder:text-white/20 focus:border-white/[0.15] focus:outline-none font-mono"
                />
                <button
                  onClick={() => wallet && claimCredential()}
                  disabled={!wallet}
                  className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white/50 hover:bg-white/[0.1] transition-colors disabled:opacity-30"
                >
                  Go
                </button>
              </div>

              <p className="text-[11px] text-white/15 mt-4">Reads from Solana mainnet. No signatures required.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
