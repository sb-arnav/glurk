import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";

import {
  getSerializedGlurkProfile,
  type SerializedCredential,
} from "@/lib/glurk-profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPLORER_BASE = "https://explorer.solana.com";

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  founding: "#5B4FE8",
};

const TIER_BG: Record<string, string> = {
  platinum: "bg-white/[0.05] border-white/[0.1]",
  gold: "bg-yellow-500/[0.04] border-yellow-500/[0.1]",
  silver: "bg-white/[0.03] border-white/[0.06]",
  bronze: "bg-orange-900/[0.05] border-orange-800/[0.1]",
  founding: "bg-[#5B4FE8]/[0.06] border-[#5B4FE8]/[0.18]",
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
  "solana-activity": "On-Chain Activity",
  "early-adopter": "Glurk Early Adopter",
};

function shortenAddr(addr: string, head = 4, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function issuerName(addr: string) {
  return ISSUER_NAMES[addr] || shortenAddr(addr, 6, 4);
}

function credLabel(slug: string) {
  return (
    SLUG_LABELS[slug] ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

type RouteProps = {
  params: Promise<{ wallet: string }>;
};

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { wallet } = await params;

  if (!isValidPubkey(wallet)) {
    return { title: "Glurk · Unknown wallet" };
  }

  try {
    const profile = await getSerializedGlurkProfile(wallet);
    const title = `Glurk Score ${profile.glurkScore} · ${shortenAddr(wallet, 6, 6)}`;
    const description =
      profile.credentials.length === 0
        ? `${shortenAddr(wallet, 6, 6)} has no Glurk credentials yet.`
        : `Verified on Solana: ${profile.credentials.length} credential${
            profile.credentials.length === 1 ? "" : "s"
          } across ${new Set(profile.credentials.map((c) => c.issuer)).size} issuer${
            new Set(profile.credentials.map((c) => c.issuer)).size === 1 ? "" : "s"
          }. Glurk Score ${profile.glurkScore}/1000.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: `Glurk · ${shortenAddr(wallet, 6, 6)}` };
  }
}

function ScoreArc({ score }: { score: number }) {
  const pct = Math.min(score, 1000) / 1000;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct * 0.75);

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-[135deg]" fill="none">
        <circle
          cx="64"
          cy="64"
          r={r}
          stroke="white"
          strokeOpacity="0.06"
          strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeLinecap="round"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          stroke="#5B4FE8"
          strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-black text-[#7B6FF8]">{score}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 -mt-0.5">
          Glurk · /1000
        </p>
      </div>
    </div>
  );
}

function CredentialRow({ cred }: { cred: SerializedCredential }) {
  const date = new Date(cred.timestamp * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const tierBg = TIER_BG[cred.tier] || TIER_BG.bronze;
  const tierColor = TIER_COLORS[cred.tier] || TIER_COLORS.bronze;

  return (
    <a
      href={`${EXPLORER_BASE}/address/${cred.pubkey}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-colors hover:border-white/20 ${tierBg}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: tierColor }}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{credLabel(cred.slug)}</p>
          <p className="text-[11px] text-white/30">
            {issuerName(cred.issuer)} · {date}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: tierColor }}
        >
          {cred.tier}
        </p>
        <p className="text-[10px] text-white/25 font-mono">verify ↗</p>
      </div>
    </a>
  );
}

export default async function PublicProfilePage({ params }: RouteProps) {
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

  const issuerCount = new Set(profile.credentials.map((c) => c.issuer)).size;
  const sortedCredentials = [...profile.credentials].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Public Identity
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(5,4,18,0.32)] backdrop-blur-xl">
          <ScoreArc score={profile.glurkScore} />

          <div className="mt-6 text-center">
            <p className="font-mono text-sm text-white/60">
              {shortenAddr(wallet, 6, 6)}
            </p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <a
                href={`${EXPLORER_BASE}/address/${wallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
              >
                view on solana ↗
              </a>
              <Link
                href="/score"
                className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
              >
                how the score works ↗
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Credentials
              </p>
              <p className="mt-1 text-lg font-black text-white/80">
                {profile.credentials.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Issuers
              </p>
              <p className="mt-1 text-lg font-black text-white/80">{issuerCount}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Active Consents
              </p>
              <p className="mt-1 text-lg font-black text-white/80">
                {profile.consents.filter((c) => c.active).length}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Verified Credentials
          </p>
          {sortedCredentials.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/40">
                No credentials yet. This wallet hasn&apos;t been issued any verifiable skills on
                Glurk.
              </p>
              <Link
                href="/issuers"
                className="inline-block mt-4 text-[11px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
              >
                see issuers →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCredentials.map((cred) => (
                <CredentialRow key={cred.pubkey} cred={cred} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">
            What is this?
          </p>
          <p className="text-sm text-white/55 leading-relaxed">
            Glurk is the credit bureau for skills, on Solana. Every credential above is a
            non-transferable PDA on-chain — issued by a registered issuer, owned by this
            wallet, and verifiable by anyone without an API key.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
            >
              learn more →
            </Link>
            <Link
              href="/issuers"
              className="text-[11px] font-mono text-white/40 hover:text-white transition-colors"
            >
              become an issuer →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">devnet</span>
        </div>
      </footer>
    </div>
  );
}
