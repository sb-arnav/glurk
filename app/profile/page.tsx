"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
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

const ISSUER_NAMES: Record<string, string> = {
  BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT: "Staq",
  JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k: "GitHub",
};

const SLUG_LABELS: Record<string, string> = {
  "credit-score": "Credit Score Basics",
  stocks: "Stock Market Basics",
  upi: "UPI Payments",
  "sell-rules": "Sell Rules",
  "github-reputation": "Developer Reputation",
};

function issuerName(addr: string) {
  return ISSUER_NAMES[addr] || shortenAddr(addr, 6, 4);
}

function credLabel(slug: string) {
  return SLUG_LABELS[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
          <p className="text-sm font-semibold">{credLabel(cred.slug)}</p>
          <p className="text-[11px] text-white/25">
            {issuerName(cred.issuer)} · {date}
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

function ConsentRow({
  consent,
  userWallet,
  onRevoked,
}: {
  consent: Consent;
  userWallet: string;
  onRevoked: (pubkey: string) => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const date = new Date(consent.grantedAt * 1000).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });

  async function handleRevoke() {
    if (!window.solana?.isPhantom) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      const res = await fetch("/api/revoke-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userWallet, requesterWallet: consent.requester }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build transaction");

      const { Transaction, Connection } = await import("@solana/web3.js");
      const txBytes = Buffer.from(data.tx, "base64");
      const tx = Transaction.from(txBytes);
      const signed = await window.solana.signTransaction(tx);

      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const txSig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction({
        signature: txSig,
        blockhash: data.blockhash,
        lastValidBlockHeight: data.lastValidBlockHeight,
      });
      onRevoked(consent.pubkey);
    } catch (e: unknown) {
      setRevokeError((e as Error).message?.slice(0, 100) ?? "Revoke failed");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold font-mono">{shortenAddr(consent.requester)}</p>
          <p className="text-[11px] text-white/25">Granted {date}</p>
          {revokeError && (
            <p className="text-[10px] text-red-400 mt-1">{revokeError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            consent.active
              ? "bg-[#5B4FE8]/10 text-[#7B6FF8] border-[#5B4FE8]/20"
              : "bg-white/[0.04] text-white/25 border-white/[0.08]"
          }`}>
            {consent.active ? "active" : "revoked"}
          </span>
          {consent.active && (
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="text-[10px] font-mono text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40 px-1.5 py-0.5 rounded border border-red-500/20 hover:border-red-500/40"
            >
              {revoking ? "..." : "revoke"}
            </button>
          )}
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
  const { data: session, status: sessionStatus } = useSession();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [sasAttestations, setSasAttestations] = useState<SasAttestation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<"idle" | "linking" | "linked" | "error">("idle");
  const [googleLinked, setGoogleLinked] = useState(false);

  // If Google session exists and wallet is linked, auto-load credentials
  useEffect(() => {
    if (sessionStatus !== "authenticated" || walletAddress) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.wallet) {
          setWalletAddress(data.wallet);
          setChainData({
            credentials: data.credentials ?? [],
            consents: data.consents ?? [],
            glurkScore: data.glurkScore ?? 0,
          });
          setGoogleLinked(true);
          setLinkStatus("linked");
        }
      })
      .catch(() => {});
  }, [sessionStatus, walletAddress]);

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
      if (session?.user?.email) await linkWalletToEmail(addr);
    } catch {
      setError("Wallet connection cancelled.");
    } finally {
      setConnecting(false);
    }
  }

  const loadCredentials = useCallback(async function loadCredentials(addr: string) {
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
  }, []);

  async function linkWalletToEmail(addr: string) {
    if (!session?.user?.email) return;
    setLinkStatus("linking");
    try {
      const res = await fetch("/api/auth/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: addr }),
      });
      if (!res.ok) throw new Error("Link failed");
      setLinkStatus("linked");
    } catch {
      setLinkStatus("error");
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
              <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
              <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Image src="/glurk.png" alt="Glurk" width={64} height={64} />
            </div>
            <span className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-4">
              Identity Dashboard
            </span>
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

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-white/20">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

	            {session ? (
	              <div className="text-center">
	                <p className="text-xs text-white/40 mb-1">Signed in as <span className="text-[#7B6FF8]">{session.user?.email}</span></p>
	                <p className="text-[11px] text-white/20">
	                  Connect your wallet above to link it to your email.
	                </p>
	              </div>
	            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-semibold text-sm text-white/60">Sign in with Google to link your email</span>
              </button>
            )}

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
              <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
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
            <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
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
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(5,4,18,0.35)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF]">
              Live Identity
            </span>
            <div className="flex items-center gap-2">
              {googleLinked && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/30">
                  via Google
                </span>
              )}
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                Solana Devnet
              </span>
            </div>
          </div>
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
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Score</p>
              <p className="mt-1 text-sm font-semibold text-[#A79EFF]">{score}/1000</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Issued</p>
              <p className="mt-1 text-sm font-semibold text-white/70">{creds.length}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Apps</p>
              <p className="mt-1 text-sm font-semibold text-blue-300">{consents.filter((c) => c.active).length}</p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Credentials {creds.length > 0 && <span className="text-white/15">· live from devnet</span>}
          </p>
          {creds.length === 0 ? (
            <div className="py-10 px-6 text-center rounded-2xl border border-white/[0.05] bg-white/[0.02]">
              <p className="text-sm font-semibold mb-1">No credentials yet</p>
              <p className="text-[13px] text-white/35 leading-relaxed mb-5">
                Credentials are issued by apps when you use them. Staq is the first live issuer — complete financial literacy modules to earn your first on-chain credentials.
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
                <ConsentRow
                  key={c.pubkey}
                  consent={c}
                  userWallet={walletAddress!}
                  onRevoked={(pubkey) => {
                    setChainData((prev) =>
                      prev
                        ? {
                            ...prev,
                            consents: prev.consents.map((x) =>
                              x.pubkey === pubkey ? { ...x, active: false } : x
                            ),
                          }
                        : prev
                    );
                  }}
                />
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

        {/* Link email to wallet */}
        {session?.user?.email ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">Email identity</p>
            {linkStatus === "linked" ? (
              <div className="flex items-center gap-2">
                <span className="text-[#7B6FF8] text-sm">✓</span>
                <p className="text-sm text-white/60"><span className="text-[#7B6FF8]">{session.user.email}</span> linked to this wallet</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-white/40">Link <span className="text-white/60">{session.user.email}</span> to this wallet so apps can find you by email.</p>
                <button
                  onClick={() => linkWalletToEmail(walletAddress)}
                  disabled={linkStatus === "linking"}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#5B4FE8]/15 border border-[#5B4FE8]/30 text-[#7B6FF8] text-xs font-semibold hover:bg-[#5B4FE8]/25 transition-colors disabled:opacity-60"
                >
                  {linkStatus === "linking" ? "Linking..." : "Link"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-0.5">Link your email</p>
              <p className="text-xs text-white/35">Apps can look you up by email — no wallet address needed.</p>
            </div>
            <button
              onClick={() => signIn("google")}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-colors text-xs font-semibold text-white/60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-[28px] border border-[#5B4FE8]/[0.12] bg-[#5B4FE8]/[0.05] p-5 shadow-[0_20px_48px_rgba(91,79,232,0.12)]">
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
