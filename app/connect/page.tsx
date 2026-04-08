"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

type Source = {
  id: string;
  name: string;
  description: string;
  href: string;
  status: "live" | "soon";
  icon: React.ReactNode;
  accent: string;
};

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" fillOpacity="0.7">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function SolanaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 397.7 311.7" fill="none">
      <linearGradient id="sol-a" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path fill="url(#sol-a)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path fill="url(#sol-a)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path fill="url(#sol-a)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

function StaqIcon() {
  return (
    <div className="w-[22px] h-[22px] rounded bg-[#5B4FE8]/30 border border-[#5B4FE8]/40 flex items-center justify-center text-[9px] font-black text-[#7B6FF8]">
      S
    </div>
  );
}

const SOURCES: Source[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Developer reputation from repos, stars, followers, and contributions.",
    href: "/connect/github",
    status: "live",
    icon: <GithubIcon />,
    accent: "white",
  },
  {
    id: "solana",
    name: "Solana Wallet",
    description: "On-chain activity: transaction history, token holdings, DeFi positions.",
    href: "/connect/solana",
    status: "live",
    icon: <SolanaIcon />,
    accent: "#14F195",
  },
  {
    id: "staq",
    name: "Staq",
    description: "Financial literacy credentials from completing Staq learning modules.",
    href: "https://staq.slayerblade.site",
    status: "live",
    icon: <StaqIcon />,
    accent: "#5B4FE8",
  },
];

export default function ConnectPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
            <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
          </Link>
          <Link
            href="/profile"
            className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            Your Profile →
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="max-w-xl mb-12">
          <span className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-3 py-1 text-[11px] font-mono tracking-widest uppercase text-[#A79EFF] mb-5">
            Connect
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Build your identity<span className="text-[#7B6FF8]">.</span>
          </h1>
          <p className="text-white/40 leading-relaxed">
            Each source adds a credential to your Glurk profile. More credentials = higher score = better access across every integrated app.
          </p>
        </div>

        {session?.user?.email && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#7B6FF8]" />
            <p className="text-[13px] text-white/40">
              Signed in as <span className="text-white/60">{session.user.email}</span> — credentials will auto-link to your profile.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {SOURCES.map((source) => (
            <Link
              key={source.id}
              href={source.href}
              className="group flex items-center gap-5 p-5 rounded-[20px] border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all shadow-[0_16px_36px_rgba(6,5,18,0.18)]"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                {source.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-[15px]">{source.name}</p>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      source.status === "live"
                        ? "bg-[#5B4FE8]/10 text-[#7B6FF8] border-[#5B4FE8]/20"
                        : "bg-white/[0.04] text-white/25 border-white/[0.08]"
                    }`}
                  >
                    {source.status}
                  </span>
                </div>
                <p className="text-sm text-white/35">{source.description}</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all shrink-0"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-[20px] border border-dashed border-white/[0.08] p-5 text-center">
          <p className="text-sm text-white/25 mb-1">More sources coming</p>
          <p className="text-[12px] text-white/15">
            Twitter/X · Stack Overflow · LinkedIn · On-chain DeFi positions
          </p>
        </div>

        <div className="mt-12 rounded-[24px] border border-[#5B4FE8]/[0.12] bg-[#5B4FE8]/[0.04] p-6">
          <p className="font-bold mb-1">Why connect multiple sources?</p>
          <p className="text-sm text-white/40 leading-relaxed">
            Your Glurk Score compounds across all credentials from all issuers.
            A developer with verified financial literacy AND strong GitHub activity
            gets better rates, faster hiring, and more trust than either credential alone.
            Every connection makes your identity stronger.
          </p>
        </div>
      </div>
    </div>
  );
}
