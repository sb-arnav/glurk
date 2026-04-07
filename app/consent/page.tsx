"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";

const RPC_URL = "https://api.devnet.solana.com";
const EXPLORER_BASE = "https://explorer.solana.com/tx";

// Credential slugs Staq has issued — used to build the "will read" list
// In production, fetched from /api/credentials for the connected wallet
const STAQ_CREDENTIAL_META: Record<string, { name: string; tier: string; issuer: string }> = {
  "credit-score":  { name: "Credit Score Basics",  tier: "gold",     issuer: "Staq" },
  "stocks":        { name: "Stock Market Basics",   tier: "gold",     issuer: "Staq" },
  "upi":           { name: "UPI Payments",          tier: "platinum", issuer: "Staq" },
  "sell-rules":    { name: "Sell Rules",            tier: "gold",     issuer: "Staq" },
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

// TypeScript declaration for Phantom
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

function PhantomIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="28" fill="#AB9FF2" />
      <ellipse cx="64" cy="65" rx="42" ry="42" fill="white" />
      <circle cx="53" cy="58" r="10" fill="#AB9FF2" />
      <circle cx="75" cy="58" r="10" fill="#AB9FF2" />
      <circle cx="50" cy="57" r="3.5" fill="white" />
      <circle cx="72" cy="57" r="3.5" fill="white" />
    </svg>
  );
}

type WalletState =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; publicKey: PublicKey }
  | { status: "no_phantom" };

type ConsentState =
  | { status: "idle" }
  | { status: "building" }
  | { status: "signing" }
  | { status: "submitting" }
  | { status: "success"; txSig: string }
  | { status: "already_granted" }
  | { status: "error"; message: string };

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [consent, setConsent] = useState<ConsentState>({ status: "idle" });
  const [credentials, setCredentials] = useState<
    { slug: string; name: string; tier: string; issuer: string; score?: number }[]
  >([]);
  const [glurkScore, setGlurkScore] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);

  const appName = searchParams.get("app") || "Unknown App";
  const appIcon = searchParams.get("icon") || "🏦";
  const requestedFields = (searchParams.get("fields") || "credit-score,stocks").split(",");
  const contributionSlug = searchParams.get("contribute_slug") || "trading-history";
  const contributionName = searchParams.get("contribute_name") || "Trading History";
  const contributionTier = searchParams.get("contribute_tier") || "gold";
  const callbackUrl = searchParams.get("callback") || "/demo/lend";

  const requestedCredentialsMeta: { slug: string; name: string; tier: string; issuer: string; score?: number }[] =
    requestedFields.map((slug) => ({
      slug,
      ...(STAQ_CREDENTIAL_META[slug] || { name: slug, tier: "bronze", issuer: "Unknown" }),
    }));

  // After wallet connects, fetch their real on-chain credentials
  useEffect(() => {
    if (wallet.status !== "connected") return;
    const walletAddress = wallet.publicKey.toBase58();

    fetch(`/api/credentials?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.credentials) {
          // Merge on-chain data with display metadata
          const enriched = requestedFields.map((slug) => {
            const onChain = data.credentials.find((c: { slug: string }) => c.slug === slug);
            const meta = STAQ_CREDENTIAL_META[slug] || { name: slug, tier: "bronze", issuer: "Unknown" };
            return {
              slug,
              name: meta.name,
              tier: onChain?.tier || meta.tier,
              issuer: meta.issuer,
              score: onChain?.score,
            };
          });
          setCredentials(enriched);
          setGlurkScore(data.glurkScore ?? null);
        }
      })
      .catch(() => {
        // Fallback to metadata if RPC fails
        setCredentials(requestedCredentialsMeta);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.status]);

  async function connectWallet() {
    if (!window.solana?.isPhantom) {
      setWallet({ status: "no_phantom" });
      return;
    }
    setWallet({ status: "connecting" });
    try {
      const resp = await window.solana.connect();
      setWallet({ status: "connected", publicKey: resp.publicKey });
    } catch {
      setWallet({ status: "disconnected" });
    }
  }

  async function handleApprove() {
    if (wallet.status !== "connected") return;
    setConsent({ status: "building" });

    try {
      // 1. Build partial tx server-side
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userWallet: wallet.publicKey.toBase58(),
          contributionSlug,
          contributionTier,
          contributionScore: 75,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to build transaction");

      if (data.alreadyGranted) {
        setConsent({ status: "already_granted" });
        setTimeout(() => redirectToCallback(wallet.publicKey.toBase58(), true), 1200);
        return;
      }

      // 2. Deserialize the partial tx
      setConsent({ status: "signing" });
      const txBytes = Buffer.from(data.tx, "base64");
      const tx = Transaction.from(txBytes);

      // 3. Have Phantom sign (adds user signature)
      const signedTx = await window.solana!.signTransaction(tx);

      // 4. Submit to devnet
      setConsent({ status: "submitting" });
      const connection = new Connection(RPC_URL, "confirmed");
      const txSig = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction({
        signature: txSig,
        blockhash: data.blockhash,
        lastValidBlockHeight: data.lastValidBlockHeight,
      });

      setConsent({ status: "success", txSig });
      setTimeout(() => redirectToCallback(wallet.publicKey.toBase58(), true, txSig), 2000);
    } catch (e: unknown) {
      const err = e as Error;
      // User rejected in Phantom
      if (err.message?.includes("User rejected")) {
        setConsent({ status: "idle" });
        return;
      }
      setConsent({ status: "error", message: err.message });
    }
  }

  function redirectToCallback(walletAddress: string, approved: boolean, txSig?: string) {
    const params = new URLSearchParams({
      approved: String(approved),
      wallet: walletAddress,
      ...(txSig && { txSig }),
    });
    router.push(`${callbackUrl}?${params.toString()}`);
  }

  function handleDeny() {
    setDenied(true);
    setTimeout(() => router.push(`${callbackUrl}?approved=false`), 800);
  }

  // ─── States ───

  if (wallet.status === "no_phantom") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] text-center">
          <p className="text-lg font-bold mb-2">Phantom not found</p>
          <p className="text-sm text-white/35 mb-6">
            Install the Phantom wallet extension to use Glurk Protocol.
          </p>
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#AB9FF2]/15 border border-[#AB9FF2]/30 text-[#AB9FF2] font-semibold hover:bg-[#AB9FF2]/25 transition-colors"
          >
            <PhantomIcon size={18} />
            Get Phantom
          </a>
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

  if (consent.status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5B4FE8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-lg font-bold">Access Granted</p>
          <a
            href={`${EXPLORER_BASE}/${consent.txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-[#7B6FF8]/60 hover:text-[#7B6FF8] transition-colors mt-2 block"
          >
            {consent.txSig.slice(0, 16)}... on Solana ↗
          </a>
          <p className="text-sm text-white/30 mt-3">Redirecting to {appName}...</p>
        </div>
      </div>
    );
  }

  if (consent.status === "already_granted") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B4FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-lg font-bold">Already connected</p>
          <p className="text-sm text-white/30 mt-1">Consent exists on-chain. Redirecting...</p>
        </div>
      </div>
    );
  }

  // ─── Wallet connect screen ───

  if (wallet.status !== "connected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Image src="/glurk.png" alt="Glurk" width={48} height={48} />
            </div>
            <p className="text-xs text-white/30 font-mono tracking-widest uppercase">
              Glurk Protocol
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="text-lg font-bold mb-1">Connect your wallet</h2>
            <p className="text-sm text-white/35 mb-6 leading-relaxed">
              Your wallet signature is your consent. Glurk reads your on-chain
              credentials and shows them to apps you authorize.
            </p>
            <div className="space-y-2">
              <button
                onClick={connectWallet}
                disabled={wallet.status === "connecting"}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#AB9FF2]/10 border border-[#AB9FF2]/25 hover:bg-[#AB9FF2]/15 hover:border-[#AB9FF2]/40 transition-all disabled:opacity-60"
              >
                <PhantomIcon size={24} />
                <span className="font-semibold text-sm flex-1 text-left">
                  {wallet.status === "connecting" ? "Connecting..." : "Phantom"}
                </span>
                {wallet.status === "connecting" ? (
                  <svg className="animate-spin w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] opacity-40 cursor-not-allowed">
                <div className="w-6 h-6 rounded-full bg-[#F08B00]/20 border border-[#F08B00]/30 flex items-center justify-center text-[10px] font-black text-[#F08B00]">S</div>
                <span className="font-semibold text-sm text-white/50">Solflare</span>
                <span className="ml-auto text-[10px] text-white/20 font-mono">soon</span>
              </div>
            </div>
            <p className="text-[11px] text-white/15 mt-5 text-center">
              Connects to Solana devnet
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Consent card ───

  const walletAddress = wallet.publicKey.toBase58();
  const displayCredentials = credentials.length > 0 ? credentials : requestedCredentialsMeta;
  const displayScore = glurkScore ?? "—";

  const isProcessing =
    consent.status === "building" ||
    consent.status === "signing" ||
    consent.status === "submitting";

  const processingLabel =
    consent.status === "building" ? "Building transaction..." :
    consent.status === "signing" ? "Sign in Phantom..." :
    consent.status === "submitting" ? "Submitting to Solana..." :
    "Approve";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-sm font-black text-white/30">
            G
          </div>
          <p className="text-xs text-white/30 font-mono tracking-widest uppercase">
            Glurk Protocol
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          {/* App requesting */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                {appIcon}
              </div>
              <div>
                <p className="font-bold text-[15px]">{appName}</p>
                <p className="text-xs text-white/30">wants to access your identity</p>
              </div>
            </div>
          </div>

          {/* Will read */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
              Will read
            </p>
            <div className="space-y-2">
              {displayCredentials.map((c) => (
                <div key={c.slug} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-white/30">{c.issuer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TIER_COLORS[c.tier] }}>
                      {c.tier}
                    </p>
                    {c.score !== undefined && (
                      <p className="text-[10px] text-white/25">{c.score}/100</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#5B4FE8]/[0.04] border border-[#5B4FE8]/[0.08]">
                <div>
                  <p className="text-sm font-semibold text-[#7B6FF8]">Glurk Score</p>
                  <p className="text-[11px] text-white/30">Cross-app reputation</p>
                </div>
                <span className="text-lg font-black text-[#7B6FF8]">{displayScore}</span>
              </div>
            </div>
          </div>

          {/* Will contribute */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
              Will contribute to your profile
            </p>
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
              Enforced on-chain — the app cannot read without writing. Your profile gets richer with every connection.
            </p>
          </div>

          {/* Signed in as */}
          <div className="p-6 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">
              Signed in as
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#AB9FF2]/15 border border-[#AB9FF2]/25 flex items-center justify-center">
                <PhantomIcon size={16} />
              </div>
              <p className="text-[11px] font-mono text-white/40">
                {walletAddress.slice(0, 12)}...{walletAddress.slice(-6)}
              </p>
            </div>
          </div>

          {/* Error state */}
          {consent.status === "error" && (
            <div className="px-6 pt-4">
              <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/[0.15] rounded-lg px-3 py-2">
                {consent.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="p-6 flex gap-3">
            <button
              onClick={handleDeny}
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-semibold text-white/50 hover:bg-white/[0.05] hover:text-white/70 transition-all disabled:opacity-40"
            >
              Deny
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing && (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                </svg>
              )}
              {isProcessing ? processingLabel : "Approve"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 mt-6">
          Consent recorded on Solana. You control your data.
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
