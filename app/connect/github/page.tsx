"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";

type CredentialResult = {
  ok: boolean;
  alreadyExists?: boolean;
  credential: {
    slug: string;
    tier: string;
    score: number;
    mintAddress?: string;
    txSig?: string;
    credentialPda: string;
  };
  github: {
    username: string;
    repos: number;
    followers: number;
    stars: number;
    contributions: number;
  };
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

export default function ConnectGitHubPage() {
  const { data: session } = useSession();
  const isGitHub = (session as any)?.provider === "github";
  const githubUsername = (session as any)?.githubUsername;

  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<CredentialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claimCredential() {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/github-credential", { method: "POST" });
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
          <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase px-2 py-1 border border-white/[0.06] rounded-md">
            Issuer: GitHub
          </span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {result ? (
            // ─── Success ───
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
                <span className="font-mono text-white/60">@{result.github.username}</span> ·{" "}
                <span style={{ color: TIER_COLORS[result.credential.tier] }} className="font-bold uppercase text-xs">
                  {result.credential.tier}
                </span>
              </p>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { label: "Repos", value: result.github.repos },
                  { label: "Followers", value: result.github.followers },
                  { label: "Stars", value: result.github.stars },
                  { label: "Pushes", value: result.github.contributions },
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
                <Link
                  href="/profile"
                  className="flex-1 py-3 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors text-center"
                >
                  View Profile
                </Link>
                <Link
                  href="/"
                  className="flex-1 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white/60 text-sm font-semibold hover:bg-white/[0.06] transition-colors text-center"
                >
                  Home
                </Link>
              </div>
            </div>
          ) : isGitHub && githubUsername ? (
            // ─── Connected, ready to claim ───
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" fillOpacity="0.6">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <span className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40 mb-4">
                Connected
              </span>
              <h2 className="text-xl font-bold mb-1">@{githubUsername}</h2>
              <p className="text-sm text-white/35 mb-6 leading-relaxed">
                We&apos;ll read your public repos, stars, followers, and recent push activity to calculate your developer reputation score.
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
                {claiming ? "Issuing on Solana devnet..." : "Claim GitHub credential"}
              </button>
              <p className="text-[11px] text-white/15 mt-3">Mints a real Token-2022 SBT on Solana devnet</p>
            </div>
          ) : (
            // ─── Not connected ───
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" fillOpacity="0.3">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <span className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
                GitHub Reputation
              </span>
              <h1 className="text-2xl font-black mb-2">Verify your developer reputation</h1>
              <p className="text-sm text-white/35 leading-relaxed mb-8">
                Connect GitHub to get a verified on-chain credential based on your repos, stars, followers, and contribution activity. Your credential composes with all other Glurk issuers into one portable identity.
              </p>
              <button
                onClick={() => signIn("github")}
                className="w-full py-4 rounded-2xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="font-semibold text-[15px]">Connect GitHub</span>
              </button>
              <p className="text-[11px] text-white/15 mt-4">Reads public profile data only</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
