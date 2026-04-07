"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";

import type { Transaction } from "@solana/web3.js";

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
      publicKey: PublicKey | null;
    };
  }
}

const EXPLORER_BASE = "https://explorer.solana.com";

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

// Shorten an address/pubkey for display
function shortenAddr(addr: string, pre = 8, suf = 6) {
  if (addr.length <= pre + suf + 3) return addr;
  return `${addr.slice(0, pre)}...${addr.slice(-suf)}`;
}

type Credential = {
  pubkey: string;
  issuer: string;
  user: string;
  slug: string;
  tier: string;
  score: number;
  timestamp: number;
};

type Consent = {
  pubkey: string;
  user: string;
  requester: string;
  grantedAt: number;
  active: boolean;
};

type SasAttestation = {
  slug: string;
  attestationAddress: string;
  exists: boolean;
};

type ChainData = {
  credentials: Credential[];
  consents: Consent[];
  glurkScore: number;
};

function ScoreArc({ score }: { score: number }) {
  const pct = score / 1000;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct * 0.75);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-[135deg]" fill="none">
        <circle cx="64" cy="64" r={r} stroke="white" strokeOpacity="0.06" strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
        <circle cx="64" cy="64" r={r} stroke="#5B4FE8" strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={dashOffset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black text-[#7B6FF8]">{score}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 -mt-0.5">Glurk</p>
      </div>
    </div>
  );
}

function CredentialRow({ cred, hasSas }: { cred: Credential; hasSas?: boolean }) {
  const date = new Date(cred.timestamp * 1000).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl border ${TIER_BG[cred.tier] || TIER_BG.bronze}`}>
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TIER_COLORS[cred.tier] || TIER_COLORS.bronze }} />
        <div>
          <p className="text-sm font-semibold">{cred.slug}</p>
          <p className="text-[11px] text-white/25">
            {shortenAddr(cred.issuer, 6, 4)} · {date}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TIER_COLORS[cred.tier] || TIER_COLORS.bronze }}>
          {cred.tier}
        </p>
        <p className="text-xs text-white/30">{cred.score}/100</p>
        {hasSas && (
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
            SAS ✓
          </span>
        )}
      </div>
    </div>
  );
}

function ConsentRow({ consent }: { consent: Consent }) {
  const date = new Date(consent.grantedAt * 1000).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold font-mono">{shortenAddr(consent.requester)}</p>
          <p className="text-[11px] text-white/25">Granted {date}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            consent.active
              ? "bg-[#5B4FE8]/10 text-[#7B6FF8] border-[#5B4FE8]/20"
              : "bg-white/[0.04] text-white/25 border-white/[0.08]"
          }`}>
            {consent.active ? "active" : "revoked"}
          </span>
          <a
            href={`${EXPLORER_BASE}/address/${consent.pubkey}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors font-mono"
          >
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [sasAttestations, setSasAttestations] = useState<SasAttestation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    if (!window.solana?.isPhantom) {
      setError("Phantom wallet not found. Install it at phantom.app");
      return;
    }
    setConnecting(true);
    try {
      const resp = await window.solana.connect();
      const addr = resp.publicKey.toBase58();
      setWalletAddress(addr);
      await loadCredentials(addr);
    } catch {
      setError("Wallet connection cancelled.");
    } finally {
      setConnecting(false);
    }
  }

  async function loadCredentials(addr: string) {
    setLoading(true);
    setError(null);
    try {
      const [credRes, sasRes] = await Promise.all([
        fetch(`/api/credentials?wallet=${addr}`),
        fetch(`/api/sas?wallet=${addr}`),
      ]);
      const data = await credRes.json();
      if (!credRes.ok) throw new Error(data.error || "Failed to fetch credentials");
      setChainData(data);
      if (sasRes.ok) {
        const sasData = await sasRes.json();
        setSasAttestations((sasData.attestations ?? []).filter((a: SasAttestation) => a.exists));
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function disconnect() {
    window.solana?.disconnect().catch(() => {});
    setWalletAddress(null);
    setChainData(null);
    setSasAttestations([]);
    setError(null);
  }

  // ─── Not connected ───

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#5B4FE8]/15 border border-[#5B4FE8]/30 flex items-center justify-center text-[10px] font-black text-[#7B6FF8]">G</div>
              <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white/20">G</div>
            <h1 className="text-2xl font-black mb-2">Your Identity</h1>
            <p className="text-white/35 text-sm leading-relaxed mb-8">
              Connect your wallet to see your real on-chain credentials, Glurk Score, and which apps have access to your data.
            </p>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2 mb-4">{error}</p>
            )}
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="w-full py-4 rounded-2xl bg-[#AB9FF2]/10 border border-[#AB9FF2]/25 hover:bg-[#AB9FF2]/15 hover:border-[#AB9FF2]/40 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
                <rect width="128" height="128" rx="28" fill="#AB9FF2" />
                <ellipse cx="64" cy="65" rx="42" ry="42" fill="white" />
                <circle cx="53" cy="58" r="10" fill="#AB9FF2" />
                <circle cx="75" cy="58" r="10" fill="#AB9FF2" />
                <circle cx="50" cy="57" r="3.5" fill="white" />
                <circle cx="72" cy="57" r="3.5" fill="white" />
              </svg>
              <span className="font-semibold text-[15px]">
                {connecting ? "Connecting..." : "Connect Phantom"}
              </span>
            </button>
            <p className="text-[11px] text-white/15 mt-4">Reads from Solana devnet</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#5B4FE8]/15 border border-[#5B4FE8]/30 flex items-center justify-center text-[10px] font-black text-[#7B6FF8]">G</div>
              <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin w-6 h-6 text-white/20 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-white/25">Reading from Solana devnet...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Connected + data ───

  const creds = chainData?.credentials ?? [];
  const consents = chainData?.consents ?? [];
  const score = chainData?.glurkScore ?? 0;
  const issuers = [...new Set(creds.map((c) => c.issuer))];
  const sasSlugSet = new Set(sasAttestations.map((a) => a.slug));

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#5B4FE8]/15 border border-[#5B4FE8]/30 flex items-center justify-center text-[10px] font-black text-[#7B6FF8]">G</div>
            <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
          </Link>
          <button
            onClick={disconnect}
            className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            {shortenAddr(walletAddress, 6, 4)} ✕
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Identity card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center gap-6">
            <ScoreArc score={score} />
            <div className="flex-1">
              <p className="font-mono text-sm text-white/50">{shortenAddr(walletAddress)}</p>
              <a
                href={`${EXPLORER_BASE}/address/${walletAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white/20 hover:text-white/40 transition-colors font-mono"
              >
                View on explorer ↗
              </a>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 text-[#7B6FF8]">
                  {creds.length} credential{creds.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30">
                  {issuers.length} issuer{issuers.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30">
                  {consents.filter((c) => c.active).length} active app{consents.filter((c) => c.active).length !== 1 ? "s" : ""}
                </span>
                {sasAttestations.length > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    SAS attested
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Credentials {creds.length > 0 && <span className="text-white/15">· live from devnet</span>}
          </p>
          {creds.length === 0 ? (
            <div className="py-10 text-center rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <p className="text-sm text-white/25">No credentials found for this wallet.</p>
              <p className="text-[11px] text-white/15 mt-1">
                Use Staq to earn your first credentials, then come back.
              </p>
                <a
                  href="https://staq.slayerblade.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[11px] text-[#7B6FF8]/60 hover:text-[#7B6FF8] transition-colors"
                >
                  staq.slayerblade.site ↗
                </a>
            </div>
          ) : (
            <div className="space-y-2">
              {creds.map((c) => (
                <CredentialRow key={c.pubkey} cred={c} hasSas={sasSlugSet.has(c.slug)} />
              ))}
            </div>
          )}
        </div>

        {/* Consents */}
        {consents.length > 0 && (
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
              App access {<span className="text-white/15">· live from devnet</span>}
            </p>
            <div className="space-y-2">
              {consents.map((c) => (
                <ConsentRow key={c.pubkey} consent={c} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-[#5B4FE8]/[0.1] bg-[#5B4FE8]/[0.02] p-5">
          <p className="font-bold mb-1">Try the protocol</p>
          <p className="text-sm text-white/35 mb-4">
            Go through the consent flow with a demo app. A real on-chain transaction will run — the app contributes data back to your profile.
          </p>
          <div className="flex gap-3">
            <Link href="/demo/lend" className="text-sm font-semibold text-[#7B6FF8] hover:text-[#8C82FF] transition-colors">
              StaqLend 🏦 →
            </Link>
            <Link href="/demo/jobs" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              StaqJobs 💼 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
