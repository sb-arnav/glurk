"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function WalletLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = value.trim();
    if (!input) return;

    if (isValidPubkey(input)) {
      router.push(`/p/${input}`);
      return;
    }

    if (looksLikeEmail(input)) {
      setLoading(true);
      try {
        const res = await fetch(`/api/lookup?email=${encodeURIComponent(input)}`);
        if (res.status === 404) {
          setError("No Glurk identity linked to this email yet.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.wallet) {
          setError(data.error || "Lookup failed");
          setLoading(false);
          return;
        }
        router.push(`/p/${data.wallet}`);
      } catch (e) {
        setError((e as Error).message || "Lookup failed");
        setLoading(false);
      }
      return;
    }

    setError("Enter a Solana wallet address or an email.");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 focus-within:border-[#5B4FE8]/50 transition-colors">
        <span className="text-[#7B6FF8] text-sm font-mono">→</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Verify any wallet — paste Solana address or email"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || value.trim().length === 0}
          className="rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3.5 py-1.5 text-[12px] font-bold"
        >
          {loading ? "…" : "Verify"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-300/80 mt-2 font-mono">{error}</p>
      )}
    </form>
  );
}
