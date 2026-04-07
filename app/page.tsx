import Link from "next/link";
import Image from "next/image";

const PROGRAM_ID = "5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ";
const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Glurk" width={28} height={28} className="rounded-lg" />
            <span className="font-bold tracking-tight">Glurk Protocol</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white/70 transition-colors font-mono text-[11px]"
            >
              {PROGRAM_ID.slice(0, 8)}...{PROGRAM_ID.slice(-4)} ↗
            </a>
            <Link
              href="/demo/lend"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-mono tracking-widest uppercase text-emerald-400/70 mb-6">
            Infrastructure · Solana Devnet
          </p>
          <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
            Apps trade data.
            <br />
            <span className="text-emerald-400">Users own everything.</span>
          </h1>
          <p className="text-lg text-white/45 leading-relaxed max-w-xl mb-10">
            Glurk is an open credential protocol on Solana where data flows both
            ways. Every app that reads a user's identity must contribute
            something back — enforced at the program level, not by terms of
            service.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/demo/lend"
              className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors text-sm"
            >
              StaqLend Demo 🏦
            </Link>
            <Link
              href="/demo/jobs"
              className="px-5 py-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold hover:bg-blue-500/25 transition-colors text-sm"
            >
              StaqJobs Demo 💼
            </Link>
            <Link
              href="/profile"
              className="px-5 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white/60 font-semibold hover:bg-white/[0.06] transition-colors text-sm"
            >
              Your Profile
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "App requests credentials",
              body: "Any registered app requests read access to a user's verified credentials — financial skills, activity history, reputation.",
              color: "blue",
            },
            {
              step: "02",
              title: "Must contribute data back",
              body: "The request_access instruction requires a data_contribution in the same transaction. No contribution = no access. Enforced on-chain.",
              color: "emerald",
            },
            {
              step: "03",
              title: "User signs consent",
              body: "The user's wallet must co-sign the transaction. No silent data harvesting. Every read is a visible on-chain event.",
              color: "purple",
            },
          ].map(({ step, title, body, color }) => (
            <div
              key={step}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <p
                className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${
                  color === "blue"
                    ? "text-blue-400/60"
                    : color === "emerald"
                    ? "text-emerald-400/60"
                    : "text-purple-400/60"
                }`}
              >
                {step}
              </p>
              <h3 className="font-bold text-[15px] mb-2">{title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 font-mono text-sm">
          <p className="text-[10px] tracking-widest uppercase text-white/20 mb-4">
            On-chain flow
          </p>
          <div className="space-y-2 text-white/50">
            <p>
              <span className="text-blue-400">app</span>.requestAccess(
            </p>
            <p className="pl-6">
              user: <span className="text-emerald-400">wallet.publicKey</span>,
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-white/20">{"// must co-sign"}</span>
            </p>
            <p className="pl-6">
              fields: [
              <span className="text-yellow-400/80">
                "credit-score", "stocks"
              </span>
              ],
            </p>
            <p className="pl-6">
              contribution: {"{"}&nbsp;
              <span className="text-white/20">{"// REQUIRED — or tx fails"}</span>
            </p>
            <p className="pl-12">
              slug:{" "}
              <span className="text-yellow-400/80">"trading-history"</span>,
            </p>
            <p className="pl-12">
              tier: <span className="text-yellow-400/80">"gold"</span>,
            </p>
            <p className="pl-12">
              score: <span className="text-purple-400">85</span>,
            </p>
            <p className="pl-6">{"}"}</p>
            <p>)</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-white/30">
              On success: contribution written on-chain, consent PDA created,
              app can read credentials
            </span>
          </div>
        </div>
      </section>

      {/* Architecture layers */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          Protocol layers
        </p>
        <div className="space-y-3">
          {[
            {
              layer: "Credential Layer",
              desc: "Approved issuers write verified facts about users. Each credential is a PDA: issuer × user × slug. Staq Financial Literacy is the first live issuer — real users, real on-chain credentials.",
              status: "live",
              detail: "Anchor program · Token-2022 SBTs",
            },
            {
              layer: "Access Layer",
              desc: "Reciprocal read/write enforcement. Apps must contribute to read. Users must sign to consent. request_access writes the contribution and the consent record atomically.",
              status: "live",
              detail: "request_access · consent PDA · revoke_access",
            },
            {
              layer: "Intelligence Layer",
              desc: "Glurk Score — a 0–1000 reputation number derived from all credentials across all issuers, weighted by tier and score. Gets richer as more apps interact with the profile.",
              status: "demo",
              detail: "Calculated client-side from all credential PDAs",
            },
          ].map(({ layer, desc, status, detail }) => (
            <div
              key={layer}
              className="flex items-start gap-6 p-5 rounded-xl border border-white/[0.06] bg-white/[0.015]"
            >
              <div className="shrink-0 pt-0.5">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                    status === "live"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/[0.05] text-white/30 border border-white/[0.08]"
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[15px] mb-1">{layer}</p>
                <p className="text-sm text-white/35 leading-relaxed mb-2">
                  {desc}
                </p>
                <p className="text-[11px] font-mono text-white/20">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SDK quickstart */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          Developer integration
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-4">
              Install
            </p>
            <div className="font-mono text-sm">
              <p className="text-white/40">
                npm install{" "}
                <span className="text-emerald-400">@glurk/sdk</span>
              </p>
              <p className="text-white/40 mt-1">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                @coral-xyz/anchor @solana/web3.js
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-4">
              Verify a credential
            </p>
            <div className="font-mono text-sm space-y-1">
              <p>
                <span className="text-blue-400">import</span>{" "}
                {"{ Glurk }"}{" "}
                <span className="text-blue-400">from</span>{" "}
                <span className="text-yellow-400/80">'@glurk/sdk'</span>;
              </p>
              <p className="mt-2">
                <span className="text-blue-400">const</span> glurk ={" "}
                <span className="text-blue-400">new</span>{" "}
                <span className="text-emerald-400">Glurk</span>(connection);
              </p>
              <p className="mt-2 text-white/40">
                <span className="text-white/60">const</span> cred ={" "}
                <span className="text-blue-400">await</span> glurk.
                <span className="text-emerald-400">verify</span>(
              </p>
              <p className="pl-4 text-white/40">
                STAQ_ISSUER, wallet,{" "}
                <span className="text-yellow-400/80">"credit-score"</span>
              </p>
              <p className="text-white/40">);</p>
              <p className="mt-1 text-white/40">
                {"// "}{" "}
                <span className="text-white/25">
                  {"{ tier: 'gold', score: 78 }"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof section */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          Live proof
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 hover:border-white/[0.12] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-3">
              Anchor Program
            </p>
            <p className="font-mono text-xs text-emerald-400 break-all">
              {PROGRAM_ID.slice(0, 22)}
              <br />
              {PROGRAM_ID.slice(22)}
            </p>
            <p className="text-[11px] text-white/20 mt-2 group-hover:text-white/40 transition-colors">
              View on explorer ↗
            </p>
          </a>
          <a
            href="https://staq.slayerblade.site"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 hover:border-white/[0.12] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-3">
              Live Issuer
            </p>
            <p className="text-[15px] font-bold">Staq</p>
            <p className="text-sm text-white/35 mt-1">
              Financial literacy app for Indian Gen Z. Real users, real on-chain credentials.
            </p>
            <p className="text-[11px] text-white/20 mt-2 group-hover:text-white/40 transition-colors">
              staq.slayerblade.site ↗
            </p>
          </a>
          <Link
            href="/demo/lend"
            className="group rounded-2xl border border-emerald-500/[0.12] bg-emerald-500/[0.03] p-5 hover:border-emerald-500/[0.25] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/40 mb-3">
              Demo · DeFi
            </p>
            <p className="text-[15px] font-bold">StaqLend 🏦</p>
            <p className="text-sm text-white/35 mt-1">
              Lower collateral based on verified financial knowledge.
            </p>
            <p className="text-[11px] text-emerald-400/40 mt-2 group-hover:text-emerald-400/70 transition-colors">
              Try the flow →
            </p>
          </Link>
          <Link
            href="/demo/jobs"
            className="group rounded-2xl border border-blue-500/[0.12] bg-blue-500/[0.03] p-5 hover:border-blue-500/[0.25] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-blue-400/40 mb-3">
              Demo · Hiring
            </p>
            <p className="text-[15px] font-bold">StaqJobs 💼</p>
            <p className="text-sm text-white/35 mt-1">
              Skip take-home tests. Verified skills unlock direct applications.
            </p>
            <p className="text-[11px] text-blue-400/40 mt-2 group-hover:text-blue-400/70 transition-colors">
              Try the flow →
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Glurk" width={20} height={20} className="rounded-md" />
            <span className="text-sm font-semibold text-white/40">
              Glurk Protocol
            </span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-white/20">
            <a
              href="https://github.com/sb-arnav/staq-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors"
            >
              GitHub
            </a>
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors"
            >
              Devnet
            </a>
            <span>Built on Solana</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
