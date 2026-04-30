import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";

import {
  getSerializedGlurkProfile,
  type SerializedCredential,
} from "@/lib/glurk-profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  founding: "#5B4FE8",
};

const ISSUER_NAMES: Record<string, string> = {
  BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT: "Staq",
  JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k: "GitHub",
};

export const metadata: Metadata = {
  // Embeds shouldn't index, and they shouldn't decorate the parent.
  robots: { index: false, follow: false },
};

function shortenAddr(addr: string, head = 4, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function ScoreArc({ score }: { score: number }) {
  const pct = Math.min(score, 1000) / 1000;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct * 0.75);

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-[135deg]" fill="none">
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="white"
          strokeOpacity="0.08"
          strokeWidth="6"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeLinecap="round"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="#5B4FE8"
          strokeWidth="6"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-black text-[#7B6FF8] leading-none">{score}</p>
        <p className="text-[8px] font-mono uppercase tracking-widest text-white/30 mt-0.5">
          Glurk
        </p>
      </div>
    </div>
  );
}

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

export default async function EmbedBadge({ params }: RouteProps) {
  const { wallet } = await params;

  if (!isValidPubkey(wallet)) {
    notFound();
  }

  let profile: Awaited<ReturnType<typeof getSerializedGlurkProfile>>;
  try {
    profile = await getSerializedGlurkProfile(wallet);
  } catch {
    notFound();
  }

  const issuers = [...new Set(profile.credentials.map((c) => c.issuer))];
  const recent: SerializedCredential[] = [...profile.credentials]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  return (
    <div
      className="font-[family-name:var(--font-sans)] text-white"
      style={{
        // Embed should look like a card, not a full-page surface.
        minHeight: 0,
        background: "transparent",
      }}
    >
      <a
        href={`/p/${wallet}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-white/[0.08] bg-[#0A0818] p-4 hover:border-[#5B4FE8]/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          <ScoreArc score={profile.glurkScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#7B6FF8]">
                Verified · Glurk
              </span>
            </div>
            <p className="font-mono text-sm text-white/80 truncate">
              {shortenAddr(wallet, 6, 6)}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 text-[#A79EFF]">
                {profile.credentials.length} cred
                {profile.credentials.length === 1 ? "" : "s"}
              </span>
              {issuers.length > 0 && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/40">
                  {issuers.length} issuer{issuers.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-1.5 flex-wrap">
            {recent.map((cred) => (
              <span
                key={cred.pubkey}
                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/50"
                style={{ color: TIER_COLORS[cred.tier] || TIER_COLORS.bronze }}
              >
                {ISSUER_NAMES[cred.issuer] || "Issuer"} · {cred.tier}
              </span>
            ))}
          </div>
        )}
      </a>
    </div>
  );
}
