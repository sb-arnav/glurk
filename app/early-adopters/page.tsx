import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getEarlyAdopters } from "@/lib/early-adopters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BLINK_URL =
  "https://dial.to/?action=solana-action:https://glurk.slayerblade.site/api/actions/issue-credential";
const EXPLORER_BASE = "https://explorer.solana.com";

export const metadata: Metadata = {
  title: "Glurk Early Adopters · Founding Members",
  description:
    "The on-chain founding members of Glurk Protocol. Every wallet listed has minted the non-transferable Early Adopter credential. Claim yours from any Blink-aware client.",
  openGraph: {
    title: "Glurk Early Adopters",
    description:
      "Founding members of the credit bureau for skills. Verified on Solana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glurk Early Adopters",
    description:
      "Founding members of the credit bureau for skills. Verified on Solana.",
  },
};

function shortenAddr(addr: string, head = 4, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function formatRank(rank: number): string {
  return `#${String(rank).padStart(3, "0")}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EarlyAdoptersPage() {
  let adopters: Awaited<ReturnType<typeof getEarlyAdopters>> = [];
  let loadError: string | null = null;
  try {
    adopters = await getEarlyAdopters();
  } catch (e) {
    loadError = (e as Error).message;
  }

  const count = adopters.length;
  const founder = adopters[0];

  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Founding Members
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
          On-chain · Solana devnet · live
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-[1.05]">
          The first {count > 0 ? count.toLocaleString() : ""} wallets to{" "}
          <span className="text-[#5B4FE8]">prove they were here.</span>
        </h1>
        <p className="text-white/55 text-[15px] leading-relaxed max-w-2xl mb-8">
          Every wallet on this list owns a non-transferable Early Adopter credential
          issued by Glurk Protocol itself. The credential lives forever on Solana — it
          cannot be sold, transferred, or revoked. Late doesn&apos;t exist twice.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <a
            href={BLINK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
          >
            Mint Early Adopter ⚡
          </a>
          <Link
            href="/score"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold text-white/80"
          >
            How the Glurk Score works →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="rounded-2xl border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/60">
              Total Minted
            </p>
            <p className="mt-1 text-3xl font-black text-white">{count.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              First Founder
            </p>
            <p className="mt-1 text-sm font-mono text-white/80 truncate">
              {founder ? shortenAddr(founder.wallet, 4, 4) : "—"}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              {founder ? formatTimestamp(founder.claimedAt) : "awaiting first claim"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              Issuer
            </p>
            <p className="mt-1 text-sm font-bold text-white/80">Glurk Protocol</p>
            <p className="mt-1 text-[10px] text-white/35">protocol-native credential</p>
          </div>
        </div>

        <section>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            The list · oldest first
          </p>
          {loadError ? (
            <div className="rounded-2xl border border-red-500/[0.15] bg-red-500/[0.04] p-5">
              <p className="text-sm text-red-300/80">
                Couldn&apos;t read from devnet right now. Try again in a moment.
              </p>
              <p className="text-[11px] font-mono text-red-300/40 mt-2">{loadError}</p>
            </div>
          ) : adopters.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/55 mb-4">
                No founders yet. Be the first wallet to mint — your rank is permanent.
              </p>
              <a
                href={BLINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
              >
                claim founder #001 →
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {adopters.map((adopter) => (
                <Link
                  key={adopter.pubkey}
                  href={`/p/${adopter.wallet}`}
                  className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className="font-mono text-[12px] tracking-wider text-[#7B6FF8] tabular-nums"
                      style={{ minWidth: 56 }}
                    >
                      {formatRank(adopter.rank)}
                    </span>
                    <span className="font-mono text-sm text-white/80 truncate">
                      {shortenAddr(adopter.wallet, 6, 6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[11px] text-white/30">
                      {formatTimestamp(adopter.claimedAt)}
                    </span>
                    <a
                      href={`${EXPLORER_BASE}/address/${adopter.pubkey}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-mono text-white/25 hover:text-white/60 transition-colors"
                    >
                      tx ↗
                    </a>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Why this list matters
          </p>
          <p className="text-sm text-white/55 leading-relaxed mb-3">
            Glurk is the credit bureau for skills, on Solana. Every credential is a
            permanent, non-transferable PDA. Future apps that read Glurk credentials —
            lenders, hirers, DAOs — will be able to filter by founding-period membership
            the same way they filter by score, tier, or issuer. Being early is itself a
            credential.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Link
              href="/"
              className="text-[11px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
            >
              what is glurk →
            </Link>
            <Link
              href="/issuers"
              className="text-[11px] font-mono text-white/40 hover:text-white transition-colors"
            >
              become an issuer →
            </Link>
            <Link
              href="/manifesto"
              className="text-[11px] font-mono text-white/40 hover:text-white transition-colors"
            >
              read the manifesto →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">devnet · live</span>
        </div>
      </footer>
    </div>
  );
}
