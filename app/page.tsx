import Link from "next/link";
import Image from "next/image";
import StatsBar from "./components/StatsBar";

const PROGRAM_ID = "5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ";
const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-24 h-72 w-72 rounded-full bg-[#5B4FE8]/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-40 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-[#7B6FF8]/10 blur-3xl" />
      </div>
      {/* Nav */}
      <nav className="relative border-b border-white/[0.06] bg-[#0B0916]/55 px-6 py-4 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={28} height={28} />
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
              className="px-4 py-2 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-3 py-1 text-[11px] font-mono tracking-widest uppercase text-[#A79EFF] mb-6">
              <span className="h-2 w-2 rounded-full bg-[#7B6FF8]" />
              Infrastructure · Solana Devnet
            </p>
            <h1 className="text-5xl font-black tracking-tight leading-[1.02] mb-6 sm:text-6xl">
              Apps trade data.
              <br />
              <span className="text-[#7B6FF8]">Users own everything.</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed max-w-2xl mb-10">
              Glurk is an open credential protocol on Solana where data flows both
              ways. Every app that reads a user&apos;s identity must contribute
              something back, enforced at the program level, not by terms of
              service.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/demo/lend"
                className="px-5 py-3 rounded-xl bg-[#5B4FE8] text-white font-bold hover:bg-[#6B5FF8] shadow-[0_16px_40px_rgba(91,79,232,0.28)] transition-colors text-sm"
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
                className="px-5 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white/70 font-semibold hover:bg-white/[0.06] transition-colors text-sm"
              >
                Your Profile
              </Link>
            </div>
            <div className="mt-5">
              <StatsBar />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(5,4,18,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/35">
                Live Signal
              </p>
              <span className="rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF]">
                Devnet
              </span>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Reciprocal access",
                  value: "Apps must write before they read",
                  tone: "purple",
                },
                {
                  label: "User-controlled consent",
                  value: "Wallet signature required for every grant",
                  tone: "blue",
                },
                {
                  label: "Portable identity",
                  value: "Credentials and score travel across apps",
                  tone: "purple",
                },
              ].map(({ label, value, tone }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        tone === "blue" ? "bg-blue-400" : "bg-[#7B6FF8]"
                      }`}
                    />
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0D0A1F] px-4 py-3">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-1">
                Program
              </p>
              <p className="font-mono text-xs text-[#A79EFF] break-all">
                {PROGRAM_ID}
              </p>
            </div>
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
              body: "Any registered app requests read access to a user's verified credentials: financial skills, activity history, reputation.",
              color: "blue",
            },
            {
              step: "02",
              title: "Must contribute data back",
              body: "The request_access instruction requires a data_contribution in the same transaction. No contribution = no access. Enforced on-chain.",
              color: "purple",
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
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_20px_40px_rgba(7,5,20,0.24)]"
            >
              <p
                className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${
                  color === "blue"
                    ? "text-blue-400/60"
                    : color === "purple"
                    ? "text-[#7B6FF8]/60"
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
        <div className="mt-8 rounded-[28px] border border-white/[0.06] bg-[#0B0916]/70 p-6 font-mono text-sm shadow-[0_20px_50px_rgba(4,4,14,0.32)] backdrop-blur-xl">
          <p className="text-[10px] tracking-widest uppercase text-white/20 mb-4">
            On-chain flow
          </p>
          <div className="space-y-2 text-white/50">
            <p>
              <span className="text-blue-400">app</span>.requestAccess(
            </p>
            <p className="pl-6">
              user: <span className="text-[#7B6FF8]">wallet.publicKey</span>,
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-white/20">{"// must co-sign"}</span>
            </p>
            <p className="pl-6">
              fields: [
              <span className="text-yellow-400/80">
                &quot;credit-score&quot;, &quot;stocks&quot;
              </span>
              ],
            </p>
            <p className="pl-6">
              contribution: {"{"}&nbsp;
              <span className="text-white/20">{"// REQUIRED - or tx fails"}</span>
            </p>
            <p className="pl-12">
              slug:{" "}
              <span className="text-yellow-400/80">&quot;trading-history&quot;</span>,
            </p>
            <p className="pl-12">
              tier: <span className="text-yellow-400/80">&quot;gold&quot;</span>,
            </p>
            <p className="pl-12">
              score: <span className="text-purple-400">85</span>,
            </p>
            <p className="pl-6">{"}"}</p>
            <p>)</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#5B4FE8] inline-block" />
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
              className="flex items-start gap-6 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
            >
              <div className="shrink-0 pt-0.5">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                    status === "live"
                      ? "bg-[#5B4FE8]/10 text-[#7B6FF8] border border-[#5B4FE8]/20"
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

      {/* Utility section */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
              Why This Wins
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              A credential only matters when it unlocks something real.
            </h2>
            <p className="text-white/40 leading-relaxed">
              Glurk is strongest when identity moves from profile theater to protocol utility.
              These are the product vectors that make the network valuable, not just novel.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/20 mb-1">
              Strategy
            </p>
            <p className="text-sm text-white/35">Privacy, scale, distribution, utility.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Private proofs",
              label: "ZK vector",
              accent: "purple",
              body: "Let users prove a threshold like score > 70 without revealing the raw credential. That makes Glurk usable in lending, hiring, and gated communities without turning identity into surveillance.",
              win: "Identity becomes enterprise-safe instead of merely on-chain.",
            },
            {
              title: "One-click distribution",
              label: "Blinks + Actions",
              accent: "yellow",
              body: "Turn consent and credential issuance into native Solana Actions so a user can claim or approve directly from social surfaces. No detour through a full product flow.",
              win: "Glurk stops feeling like infrastructure and starts feeling instant.",
            },
            {
              title: "Undercollateralized lending",
              label: "DeFi unlock",
              accent: "purple",
              body: "If the protocol can attest to verified financial knowledge and behavior, lending apps can price risk differently. The identity layer immediately translates into better borrowing terms.",
              win: "The protocol earns attention by saving users real money.",
            },
            {
              title: "Mass issuance at scale",
              label: "cNFT path",
              accent: "blue",
              body: "Compressed credentials keep the economics viable when issuers move from hundreds of users to millions. Scale needs to be a protocol feature, not a future rewrite.",
              win: "Distribution gets cheaper as adoption gets bigger.",
            },
          ].map(({ title, label, accent, body, win }) => (
            <div
              key={title}
              className={`rounded-[28px] border p-6 shadow-[0_20px_48px_rgba(6,5,18,0.22)] ${
                accent === "yellow"
                  ? "border-yellow-500/[0.14] bg-yellow-500/[0.04]"
                  : accent === "blue"
                  ? "border-blue-500/[0.12] bg-blue-500/[0.04]"
                  : "border-[#5B4FE8]/[0.14] bg-[#5B4FE8]/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                    accent === "yellow"
                      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                      : accent === "blue"
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                      : "border-[#5B4FE8]/20 bg-[#5B4FE8]/10 text-[#A79EFF]"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    accent === "yellow"
                      ? "bg-yellow-400"
                      : accent === "blue"
                      ? "bg-blue-400"
                      : "bg-[#7B6FF8]"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{body}</p>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-1">
                  The win
                </p>
                <p className="text-sm text-white/60">{win}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning section */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.04] p-6 md:p-8 shadow-[0_24px_80px_rgba(5,4,18,0.36)] backdrop-blur-xl">
          <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
                Positioning
              </p>
              <h2 className="text-3xl font-black tracking-tight mb-4">
                Not another wallet profile.
              </h2>
              <p className="text-white/40 leading-relaxed mb-6">
                Most identity products stop at aggregation. Glurk is different because it enforces reciprocity:
                if an app wants to read, it has to write. That turns every integration into a positive-sum loop.
              </p>
              <div className="flex flex-wrap gap-2">
                {["reciprocal by default", "wallet-signed consent", "portable reputation", "cross-app compounding"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[11px] font-mono text-white/40"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">
                  Hiring
                </p>
                <p className="text-sm font-semibold mb-2">Skip the take-home.</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  Verified skills unlock direct applications and reduce screening friction.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">
                  Lending
                </p>
                <p className="text-sm font-semibold mb-2">Price trust better.</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  Better verified behavior means lower collateral and fairer access to capital.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">
                  Social
                </p>
                <p className="text-sm font-semibold mb-2">Consent in the feed.</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  Blinks turn identity actions into something users can trigger anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK quickstart */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          Developer integration
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0D0A1F] p-6 shadow-[0_16px_36px_rgba(6,5,18,0.2)]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-4">
              Read a user&apos;s identity
            </p>
            <div className="font-mono text-sm space-y-0.5 leading-relaxed">
              <p><span className="text-blue-400">import</span> <span className="text-white/50">{"{"}</span> <span className="text-[#A79EFF]">getProfile</span> <span className="text-white/50">{"}"}</span> <span className="text-blue-400">from</span> <span className="text-yellow-400/80">&apos;@glurk-protocol/sdk&apos;</span>;</p>
              <p className="mt-3 text-white/50"><span className="text-white/25">{"// "}</span>works in any Solana app</p>
              <p><span className="text-blue-400">const</span> <span className="text-white/70">profile</span> = <span className="text-blue-400">await</span> <span className="text-[#7B6FF8]">getProfile</span>(</p>
              <p className="pl-6 text-white/50">connection,</p>
              <p className="pl-6 text-white/50">userWallet,</p>
              <p className="text-white/50">);</p>
              <p className="mt-3 text-white/50"><span className="text-white/25">{"// "}</span>profile.credentials → all verified skills</p>
              <p className="text-white/50"><span className="text-white/25">{"// "}</span>profile.glurkScore → <span className="text-[#A79EFF]">0–1000</span> reputation</p>
              <p className="text-white/50"><span className="text-white/25">{"// "}</span>profile.consents → apps with access</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#0D0A1F] p-6 shadow-[0_16px_36px_rgba(6,5,18,0.2)]">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-4">
              Verify a specific credential
            </p>
            <div className="font-mono text-sm space-y-0.5 leading-relaxed">
              <p><span className="text-blue-400">import</span> <span className="text-white/50">{"{"}</span> <span className="text-[#A79EFF]">verifyCredential</span><span className="text-white/50">,</span></p>
              <p className="pl-6"><span className="text-[#A79EFF]">KNOWN_ISSUERS</span> <span className="text-white/50">{"}"}</span> <span className="text-blue-400">from</span> <span className="text-yellow-400/80">&apos;@glurk-protocol/sdk&apos;</span>;</p>
              <p className="mt-3"><span className="text-blue-400">const</span> <span className="text-white/70">cred</span> = <span className="text-blue-400">await</span> <span className="text-[#7B6FF8]">verifyCredential</span>(</p>
              <p className="pl-6 text-white/50">connection,</p>
              <p className="pl-6"><span className="text-[#A79EFF]">KNOWN_ISSUERS</span>.STAQ,</p>
              <p className="pl-6 text-white/50">userWallet,</p>
              <p className="pl-6 text-yellow-400/80">&apos;credit-score&apos;,</p>
              <p className="text-white/50">);</p>
              <p className="mt-3 text-white/50"><span className="text-white/25">{"// "}</span>cred?.tier <span className="text-yellow-400/60">→ &apos;gold&apos;</span></p>
              <p className="text-white/50"><span className="text-white/25">{"// "}</span>cred?.score <span className="text-yellow-400/60">→ 78</span></p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#5B4FE8]/[0.1] bg-[#5B4FE8]/[0.02] p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-0.5">npm install @glurk-protocol/sdk</p>
              <p className="text-xs text-white/35">TypeScript-first. Zero Anchor dependency for reads.</p>
            </div>
            <a
              href="https://github.com/sb-arnav/glurk/tree/main/packages/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 rounded-xl bg-[#5B4FE8]/15 border border-[#5B4FE8]/30 text-[#7B6FF8] text-sm font-semibold hover:bg-[#5B4FE8]/25 transition-colors"
            >
              SDK docs ↗
            </a>
          </div>
          <Link
            href="/issuers"
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 flex items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
          >
            <div>
              <p className="text-sm font-semibold mb-0.5">Become an issuer</p>
              <p className="text-xs text-white/35">Issue credentials to your users through the protocol.</p>
            </div>
            <span className="shrink-0 text-white/30 text-sm">→</span>
          </Link>
        </div>
      </section>

      {/* Proof section */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-8">
          Live proof
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 hover:border-white/[0.12] transition-colors shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 mb-3">
              Anchor Program
            </p>
            <p className="font-mono text-xs text-[#7B6FF8] break-all">
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
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 hover:border-white/[0.12] transition-colors shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
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
            className="group rounded-2xl border border-[#5B4FE8]/[0.12] bg-[#5B4FE8]/[0.05] p-5 hover:border-[#5B4FE8]/[0.25] transition-colors shadow-[0_18px_40px_rgba(91,79,232,0.12)]"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#7B6FF8]/40 mb-3">
              Demo · DeFi
            </p>
            <p className="text-[15px] font-bold">StaqLend 🏦</p>
            <p className="text-sm text-white/35 mt-1">
              Lower collateral based on verified financial knowledge.
            </p>
            <p className="text-[11px] text-[#7B6FF8]/40 mt-2 group-hover:text-[#7B6FF8]/70 transition-colors">
              Try the flow →
            </p>
          </Link>
          <a
            href="https://dial.to/?action=solana-action:https://glurk.slayerblade.site/api/actions/consent?app=StaqLend&contribute_slug=trading-history&contribute_tier=gold&contribute_score=80"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-yellow-500/[0.12] bg-yellow-500/[0.03] p-5 hover:border-yellow-500/[0.25] transition-colors shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-yellow-400/40 mb-3">
              Solana Blink
            </p>
            <p className="text-[15px] font-bold">Consent via Blink ⚡</p>
            <p className="text-sm text-white/35 mt-1">
              Approve credential access directly from X/Twitter — no app needed.
            </p>
            <p className="text-[11px] text-yellow-400/40 mt-2 group-hover:text-yellow-400/70 transition-colors">
              Try on dial.to →
            </p>
          </a>
          <Link
            href="/demo/jobs"
            className="group rounded-2xl border border-blue-500/[0.12] bg-blue-500/[0.04] p-5 hover:border-blue-500/[0.25] transition-colors shadow-[0_18px_40px_rgba(54,126,255,0.1)]"
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
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="text-sm font-semibold text-white/40">
              Glurk Protocol
            </span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-white/20">
            <a
              href="https://github.com/sb-arnav/glurk"
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
