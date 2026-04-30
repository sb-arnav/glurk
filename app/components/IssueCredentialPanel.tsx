"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const RPC_URL = "https://api.devnet.solana.com";
const TIERS = ["platinum", "gold", "silver", "bronze"] as const;
type Tier = (typeof TIERS)[number];

const TIER_COLORS: Record<Tier, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

type Status =
  | { kind: "idle" }
  | { kind: "no_phantom" }
  | { kind: "connecting" }
  | { kind: "connected"; wallet: PublicKey }
  | { kind: "wrong_wallet"; connected: PublicKey }
  | { kind: "submitting"; wallet: PublicKey }
  | { kind: "already_issued"; pda: string }
  | { kind: "success"; pda: string; txSig: string; userWallet: string }
  | { kind: "error"; message: string };

export default function IssueCredentialPanel({ authority }: { authority: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [userWallet, setUserWallet] = useState("");
  const [slug, setSlug] = useState("");
  const [tier, setTier] = useState<Tier>("gold");
  const [score, setScore] = useState(80);

  // Auto-reconnect if Phantom is already linked.
  useEffect(() => {
    let cancelled = false;
    async function tryReconnect() {
      const sol = window.solana;
      if (!sol?.isPhantom) return;
      try {
        const resp = await sol.connect({ onlyIfTrusted: true });
        if (cancelled) return;
        if (resp.publicKey.toBase58() === authority) {
          setStatus({ kind: "connected", wallet: resp.publicKey });
        } else {
          setStatus({ kind: "wrong_wallet", connected: resp.publicKey });
        }
      } catch {
        // not yet trusted — leave at idle
      }
    }
    tryReconnect();
    return () => {
      cancelled = true;
    };
  }, [authority]);

  async function connect() {
    const sol = window.solana;
    if (!sol?.isPhantom) {
      setStatus({ kind: "no_phantom" });
      return;
    }
    setStatus({ kind: "connecting" });
    try {
      const resp = await sol.connect();
      if (resp.publicKey.toBase58() === authority) {
        setStatus({ kind: "connected", wallet: resp.publicKey });
      } else {
        setStatus({ kind: "wrong_wallet", connected: resp.publicKey });
      }
    } catch {
      setStatus({ kind: "idle" });
    }
  }

  async function submit() {
    if (status.kind !== "connected") return;
    const wallet = status.wallet;

    if (!userWallet.trim()) {
      setStatus({ kind: "error", message: "Target user wallet is required." });
      return;
    }
    try {
      new PublicKey(userWallet.trim());
    } catch {
      setStatus({ kind: "error", message: "Target user wallet is not a valid Solana address." });
      return;
    }
    if (!slug.trim()) {
      setStatus({ kind: "error", message: "Credential slug is required." });
      return;
    }

    setStatus({ kind: "submitting", wallet });

    try {
      const res = await fetch("/api/issuer/issue-credential-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuerWallet: wallet.toBase58(),
          userWallet: userWallet.trim(),
          slug: slug.trim(),
          tier,
          score,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build transaction");

      if (data.alreadyIssued) {
        setStatus({ kind: "already_issued", pda: data.credentialPda });
        return;
      }

      const tx = Transaction.from(Buffer.from(data.tx, "base64"));
      const signed = await window.solana!.signTransaction(tx);

      const connection = new Connection(RPC_URL, "confirmed");
      const txSig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction({
        signature: txSig,
        blockhash: data.blockhash,
        lastValidBlockHeight: data.lastValidBlockHeight,
      });

      setStatus({
        kind: "success",
        pda: data.credentialPda,
        txSig,
        userWallet: userWallet.trim(),
      });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("User rejected")) {
        setStatus({ kind: "connected", wallet });
        return;
      }
      setStatus({ kind: "error", message: err.message || "Failed to issue credential" });
    }
  }

  function reset() {
    setStatus({ kind: "connected", wallet: new PublicKey(authority) });
    setUserWallet("");
    setSlug("");
    setScore(80);
  }

  return (
    <section className="mt-12 rounded-[28px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.04] p-6 shadow-[0_18px_40px_rgba(91,79,232,0.12)]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70">
            Issue a credential
          </p>
          <p className="text-sm text-white/60 mt-1">
            Connect this issuer&apos;s wallet to write a credential to any user.
          </p>
        </div>
        {status.kind === "connected" && (
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-[#5B4FE8]/15 border border-[#5B4FE8]/25 text-[#A79EFF]">
            ready
          </span>
        )}
      </div>

      {status.kind === "idle" && (
        <button
          onClick={connect}
          className="w-full px-5 py-3 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
        >
          Connect issuer wallet (Phantom)
        </button>
      )}

      {status.kind === "no_phantom" && (
        <div className="rounded-xl border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-4 text-sm text-yellow-300/80">
          Phantom wallet not detected.{" "}
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-white"
          >
            Install Phantom
          </a>
          .
        </div>
      )}

      {status.kind === "connecting" && (
        <p className="text-sm text-white/60 text-center py-6">Approve the connection in Phantom…</p>
      )}

      {status.kind === "wrong_wallet" && (
        <div className="rounded-xl border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-4 text-sm">
          <p className="text-yellow-300/85 font-semibold mb-1">Wrong wallet connected</p>
          <p className="text-white/55 text-[13px]">
            You&apos;re signed in with{" "}
            <span className="font-mono text-white/75">
              {status.connected.toBase58().slice(0, 6)}…{status.connected.toBase58().slice(-6)}
            </span>
            . Switch in Phantom to{" "}
            <span className="font-mono text-white/75">
              {authority.slice(0, 6)}…{authority.slice(-6)}
            </span>{" "}
            to issue from this issuer.
          </p>
        </div>
      )}

      {(status.kind === "connected" || status.kind === "submitting") && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
              Target user wallet
            </label>
            <input
              type="text"
              value={userWallet}
              onChange={(e) => setUserWallet(e.target.value)}
              placeholder="user's Solana address"
              disabled={status.kind === "submitting"}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Credential slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="e.g. credit-score, founder-dao, course-101"
                disabled={status.kind === "submitting"}
                maxLength={64}
                className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
              <p className="text-[10px] text-white/30 mt-1">
                lowercase, digits, hyphens. PDA seed; must be unique per (issuer, user).
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Tier
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={status.kind === "submitting"}
                    onClick={() => setTier(t)}
                    className={`rounded-xl border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      tier === t
                        ? "bg-white/[0.05]"
                        : "border-white/[0.06] bg-transparent hover:bg-white/[0.03]"
                    }`}
                    style={
                      tier === t
                        ? { borderColor: TIER_COLORS[t], color: TIER_COLORS[t] }
                        : { color: TIER_COLORS[t], borderColor: "rgba(255,255,255,0.08)" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Score (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) =>
                  setScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                }
                disabled={status.kind === "submitting"}
                className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={status.kind === "submitting"}
            className="w-full px-5 py-3.5 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.kind === "submitting"
              ? "Building & broadcasting…"
              : `Issue ${tier} ${slug ? slug : "credential"} (${score}/100) →`}
          </button>
          <p className="text-[11px] text-white/35 leading-relaxed">
            You sign as the issuer authority. The credential PDA is{" "}
            <code className="font-mono text-white/55">[&quot;credential&quot;, you, user, slug]</code>
            . You pay rent (~0.002 SOL).
          </p>
        </div>
      )}

      {status.kind === "already_issued" && (
        <div className="rounded-xl border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-5 space-y-3">
          <p className="text-sm text-yellow-300/85 font-semibold">
            Credential already exists.
          </p>
          <p className="text-[12px] text-white/45">
            This (issuer, user, slug) combination is already on chain. Re-issue would
            collide with the existing PDA.
          </p>
          <p className="text-[11px] font-mono text-white/40 break-all">PDA: {status.pda}</p>
          <button
            onClick={reset}
            className="text-[11px] font-mono text-white/40 hover:text-white transition-colors"
          >
            issue another
          </button>
        </div>
      )}

      {status.kind === "success" && (
        <div className="rounded-xl border border-[#5B4FE8]/[0.25] bg-[#5B4FE8]/[0.06] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <p className="text-sm text-white font-semibold">Credential written on chain.</p>
          </div>
          <p className="text-[11px] font-mono text-white/40 break-all">{status.pda}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/p/${status.userWallet}`}
              className="text-[11px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
            >
              view recipient profile →
            </Link>
            <a
              href={`https://explorer.solana.com/tx/${status.txSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-white/35 hover:text-white/70 transition-colors"
            >
              tx ↗
            </a>
            <button
              onClick={reset}
              className="text-[11px] font-mono text-white/35 hover:text-white transition-colors"
            >
              issue another
            </button>
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <div className="rounded-xl border border-red-500/[0.18] bg-red-500/[0.04] p-4 space-y-2">
          <p className="text-sm text-red-300/85 font-semibold">Issuance failed</p>
          <p className="text-[12px] text-white/55 break-words">{status.message}</p>
          <button
            onClick={() => {
              try {
                const wallet = new PublicKey(authority);
                setStatus({ kind: "connected", wallet });
              } catch {
                setStatus({ kind: "idle" });
              }
            }}
            className="text-[11px] font-mono text-white/40 hover:text-white transition-colors"
          >
            try again
          </button>
        </div>
      )}
    </section>
  );
}
