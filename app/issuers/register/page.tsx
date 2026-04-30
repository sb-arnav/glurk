"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

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

const RPC_URL = "https://api.devnet.solana.com";

type Status =
  | { kind: "idle" }
  | { kind: "no_phantom" }
  | { kind: "connecting" }
  | { kind: "connected"; wallet: PublicKey }
  | { kind: "submitting"; wallet: PublicKey }
  | { kind: "already_registered"; wallet: PublicKey; pda: string }
  | { kind: "success"; wallet: PublicKey; pda: string; txSig: string }
  | { kind: "error"; message: string };

export default function RegisterIssuerPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [name, setName] = useState("");

  async function connect() {
    if (!window.solana?.isPhantom) {
      setStatus({ kind: "no_phantom" });
      return;
    }
    setStatus({ kind: "connecting" });
    try {
      const resp = await window.solana.connect();
      setStatus({ kind: "connected", wallet: resp.publicKey });
    } catch {
      setStatus({ kind: "idle" });
    }
  }

  async function register() {
    if (status.kind !== "connected") return;
    const issuerName = name.trim();
    if (issuerName.length === 0) {
      setStatus({ kind: "error", message: "Name your issuer first." });
      return;
    }
    if (issuerName.length > 64) {
      setStatus({ kind: "error", message: "Name must be 64 characters or fewer." });
      return;
    }

    const wallet = status.wallet;
    setStatus({ kind: "submitting", wallet });

    try {
      const res = await fetch("/api/issuer/register-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.toBase58(), name: issuerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build transaction");

      if (data.alreadyRegistered) {
        setStatus({ kind: "already_registered", wallet, pda: data.issuerPda });
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

      setStatus({ kind: "success", wallet, pda: data.issuerPda, txSig });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("User rejected")) {
        setStatus({ kind: "connected", wallet });
        return;
      }
      setStatus({ kind: "error", message: err.message || "Registration failed" });
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <Link
            href="/issuers"
            className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            ← all issuers
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14">
        <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
          Self-Serve · Permissionless
        </div>
        <h1 className="text-4xl font-black tracking-tight leading-[1.05] mb-4">
          Become a Glurk issuer in <span className="text-[#5B4FE8]">60 seconds.</span>
        </h1>
        <p className="text-white/55 text-[15px] leading-relaxed mb-8">
          Anyone can issue credentials on Glurk. The protocol&apos;s
          <code className="text-[13px] font-mono text-[#A79EFF] bg-[#5B4FE8]/[0.1] px-1.5 py-0.5 rounded mx-1">
            register_issuer
          </code>
          instruction is permissionless — your wallet pays the rent and becomes both the
          admin and the issuer authority for a new on-chain
          <code className="text-[13px] font-mono text-[#A79EFF] bg-[#5B4FE8]/[0.1] px-1.5 py-0.5 rounded mx-1">
            IssuerAccount
          </code>
          PDA. From that moment, you can write credentials to any user wallet.
        </p>

        {status.kind === "idle" && (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Issuer name (max 64 chars)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Skills, MyDAO, Code School…"
                className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60"
                maxLength={64}
              />
            </div>
            <button
              onClick={connect}
              disabled={name.trim().length === 0}
              className="w-full px-5 py-3.5 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Connect Phantom →
            </button>
            <p className="text-[12px] text-white/30 leading-relaxed">
              You&apos;ll need a small amount of devnet SOL (~0.002) for the rent. Get
              some at{" "}
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7B6FF8] hover:text-white transition-colors underline decoration-dotted"
              >
                faucet.solana.com
              </a>
              .
            </p>
          </div>
        )}

        {status.kind === "no_phantom" && (
          <div className="rounded-[24px] border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-6">
            <p className="text-sm text-yellow-300/80 mb-3">
              Phantom wallet not detected.
            </p>
            <a
              href="https://phantom.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white/80 hover:bg-white/[0.08] transition-colors"
            >
              Install Phantom →
            </a>
          </div>
        )}

        {status.kind === "connecting" && (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/60">Approve the connection in Phantom…</p>
          </div>
        )}

        {status.kind === "connected" && (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Connected
              </p>
              <p className="mt-1 font-mono text-sm text-white/80">
                {status.wallet.toBase58().slice(0, 6)}…{status.wallet.toBase58().slice(-6)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Issuer name
              </p>
              <p className="mt-1 text-base font-semibold">{name}</p>
            </div>
            <button
              onClick={register}
              className="w-full px-5 py-3.5 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
            >
              Sign and register on chain →
            </button>
            <p className="text-[12px] text-white/30 leading-relaxed">
              Phantom will ask you to approve a transaction. The transaction calls{" "}
              <code className="font-mono text-white/50">register_issuer(name)</code> on
              the Glurk Anchor program. Your wallet pays ~0.002 SOL for the PDA rent.
            </p>
          </div>
        )}

        {status.kind === "submitting" && (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 text-center space-y-2">
            <p className="text-sm text-white/60">Building and broadcasting…</p>
            <p className="text-[11px] font-mono text-white/30">approve in phantom</p>
          </div>
        )}

        {status.kind === "already_registered" && (
          <div className="rounded-[24px] border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-6 space-y-3">
            <p className="text-sm text-yellow-300/85 font-semibold">
              This wallet is already a registered issuer.
            </p>
            <p className="text-[12px] font-mono text-white/40 break-all">
              PDA: {status.pda}
            </p>
            <Link
              href={`/issuers/${status.wallet.toBase58()}`}
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white/80 hover:bg-white/[0.08] transition-colors"
            >
              Open issuer dashboard →
            </Link>
          </div>
        )}

        {status.kind === "success" && (
          <div className="rounded-[24px] border border-[#5B4FE8]/[0.25] bg-[#5B4FE8]/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5B4FE8] flex items-center justify-center text-xl">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-white">You&apos;re an issuer.</p>
                <p className="text-[11px] text-white/40">Welcome to the protocol.</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Your IssuerAccount PDA
              </p>
              <p className="mt-1 font-mono text-[12px] text-white/60 break-all">
                {status.pda}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/issuers/${status.wallet.toBase58()}`}
                className="px-4 py-2 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold"
              >
                Open dashboard →
              </Link>
              <a
                href={`https://explorer.solana.com/tx/${status.txSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors"
              >
                view tx ↗
              </a>
            </div>
          </div>
        )}

        {status.kind === "error" && (
          <div className="rounded-[24px] border border-red-500/[0.18] bg-red-500/[0.04] p-6 space-y-3">
            <p className="text-sm text-red-300/85 font-semibold">Registration failed</p>
            <p className="text-[12px] text-white/50 break-words">{status.message}</p>
            <button
              onClick={() => setStatus({ kind: "idle" })}
              className="mt-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors"
            >
              try again
            </button>
          </div>
        )}

        <section className="mt-12 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            What you can do as an issuer
          </p>
          <ul className="space-y-2 text-sm text-white/55">
            <li>· Issue credentials to any user wallet using the SDK or REST API</li>
            <li>· Receive contributions when other apps read those credentials</li>
            <li>· Show up in the public issuer directory</li>
            <li>· Build apps that ship with verified user identity from day one</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
