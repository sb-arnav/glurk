import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Glurk Manifesto",
  description:
    "The trust layer for everything humans (and eventually agents) do online. Identity is the last piece of internet infrastructure that hasn't been protocolized. Glurk is the protocol.",
  openGraph: {
    title: "The Glurk Manifesto",
    description: "The trust layer for everything humans do online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Glurk Manifesto",
    description: "The trust layer for everything humans do online.",
  },
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Manifesto · v1.0
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <section>
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            The Thesis
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-6">
            Identity is the last piece of internet infrastructure that hasn&apos;t been{" "}
            <span className="text-[#5B4FE8]">protocolized.</span>
          </h1>
          <p className="text-white/65 text-[16px] leading-[1.7]">
            Payments became Stripe. Communication became Twilio. Banking data became Plaid.
            Compute became AWS. Each layer collapsed from a million bespoke integrations
            into one open primitive that everything else could build on.
          </p>
          <p className="text-white/65 text-[16px] leading-[1.7] mt-4">
            Identity hasn&apos;t collapsed yet. Every app still rebuilds it from scratch —
            its own KYC, its own scoring, its own resume parsers, its own anti-fraud, its
            own rep system. LinkedIn locks employment. GitHub locks code. CIBIL locks
            credit. Twitter locks social. Each a walled garden with the user&apos;s identity
            held hostage inside.
          </p>
          <p className="text-white/85 text-[18px] leading-[1.6] mt-6 font-semibold">
            Glurk is the protocol that collapses identity into one open primitive — owned
            by the person it&apos;s about, written by anyone trusted to attest, readable by
            every app that needs to make a decision.
          </p>
        </section>

        <section>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
              The market we&apos;re actually inside
            </p>
            <ul className="space-y-3 text-white/60 text-[15px] leading-relaxed">
              <li>
                · <span className="text-white/80 font-semibold">$300B+</span> spent annually on identity verification, KYC,
                background checks, and reputation systems — fragmented across thousands
                of vendors who all do the same thing badly.
              </li>
              <li>
                · <span className="text-white/80 font-semibold">$200B+</span> recruiting and credentialing industry built
                on resumes that nobody verifies and PDFs that everyone fakes.
              </li>
              <li>
                · <span className="text-white/80 font-semibold">$50B+</span> credit-bureau industry (CIBIL, Experian, Equifax)
                — proof that the &quot;shared register of trust&quot; pattern is one of the most
                durable business models ever built.
              </li>
              <li>
                · <span className="text-white/80 font-semibold">$1T+</span> imminent: AI agents are about to do trillions
                in commerce. They have no identity layer yet. Whoever ships it first owns
                a piece of every transaction agents make for the next century.
              </li>
            </ul>
            <p className="text-white/45 text-[14px] mt-4 leading-relaxed">
              These are four separate markets today. They&apos;re one market tomorrow,
              served by one protocol.
            </p>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            01 · The mechanism
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Reciprocal data exchange, enforced by the chain.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            The reason CIBIL works isn&apos;t the database. It&apos;s the rule that you
            can&apos;t pull a credit report unless you also contribute one. Every
            participant pays in to take out. Free-riders don&apos;t exist because the
            protocol won&apos;t serve them.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Glurk encodes that rule into a Solana program. To read a credential, an app
            calls{" "}
            <code className="text-[13px] font-mono text-[#A79EFF] bg-[#5B4FE8]/[0.1] px-1.5 py-0.5 rounded">
              request_access
            </code>{" "}
            — which atomically writes the app&apos;s contribution back to the user&apos;s
            profile and creates a consent record the user must sign. No consent, no read.
            No contribution, no read. Both, atomically.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Centralized identity APIs end up as data extractors. The bigger they get, the
            more leverage they have over the apps reading from them. Glurk inverts that —
            every read makes the network richer for everyone, not poorer for the app. The
            network compounds; the platform tax never appears.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            02 · The wedge
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            India Gen Z, financial literacy, on Staq.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Universal protocols don&apos;t launch universal. They launch in a specific
            corner where the existing infrastructure is broken and the user base is
            digital-native enough to carry credentials forward.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            India has 500M Gen Z. The financial system underwrites them like strangers
            because there is no shared record of skill — academic, financial, or
            otherwise. We start there. Staq is the first issuer. Users earn Glurk
            credentials by completing real financial literacy modules. Then the same
            credential unlocks lower collateral on a lending app, faster KYC on a
            fintech, a verified profile on a job platform.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            One issuer is a closed loop. Two is a network. Ten is a moat. A hundred is a
            protocol no platform can ever displace.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            03 · The expansion
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            From financial literacy → every kind of trust.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Once the wedge is wedged, the protocol applies to anything an issuer can
            attest to about anyone. Same primitive, expanding scope:
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                year: "Year 1",
                title: "Indian fintech identity",
                body: "Staq + 5 issuers. Glurk Score becomes a real underwriting input for Indian fintechs. ₹50–100Cr ARR from hosted API + verified-issuer fees.",
              },
              {
                year: "Year 2",
                title: "Developer + professional reputation",
                body: "Every commit, course, project, contribution becomes a credential. LinkedIn for the chain era. Recruiters pay per pull. Course platforms become issuers. Job platforms become readers. ~$10B addressable.",
              },
              {
                year: "Year 3",
                title: "AI agent identity",
                body: "Agents transact as economic actors. They need credentials too — this agent is audited, this agent has shipped X jobs, this agent has $Y in escrow. First-mover on agent identity is a $100B+ outcome and the natural extension of human identity.",
              },
              {
                year: "Year 5",
                title: "The internet's trust ledger",
                body: "Anything anyone or anything has done that someone trusted observed gets attested to. Built once, used everywhere. Standard identity protocol for the post-platform internet.",
              },
            ].map((stage) => (
              <div
                key={stage.year}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]">
                    {stage.year}
                  </span>
                  <p className="font-bold text-[15px]">{stage.title}</p>
                </div>
                <p className="text-[13px] text-white/55 leading-relaxed">{stage.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            04 · The unit of trust
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Credentials are the atom. Score is the abstraction.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Each credential is a non-transferable Token-2022 mint with a PDA encoding the
            issuer, user, slug, tier, and per-module score. Auditable on chain. The math
            that turns N credentials into a 0–1000 Glurk Score is published, deterministic,
            and computable from chain data without an API call.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            We don&apos;t hide the formula behind a login wall because credibility comes
            from saying what&apos;s included and what isn&apos;t. The score is exactly the
            sum of what registered issuers have signed about you. Nothing else.
          </p>
          <Link
            href="/score"
            className="inline-block mt-4 text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
          >
            see the formula →
          </Link>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            05 · The business model
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Free chain. Paid hosted layer. Same playbook as Plaid.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            The Solana program is permanently free. Anyone can read program accounts
            directly. The chain is the moat — credentials only have value if anyone can
            verify them without permission.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            The hosted convenience layer at{" "}
            <code className="text-[13px] font-mono text-white/75">
              glurk.slayerblade.site
            </code>{" "}
            is where production traffic lives — caching, email lookups, monthly quotas,
            SLAs. That&apos;s the cash register. Free tier (1k calls/month), Pro ($49),
            Enterprise (custom). Plus issuer partnerships and verified-issuer fees.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Long-term: the natural revenue layer is per-pull pricing for institutional
            readers (the CIBIL model), captured on-chain via a treasury PDA. The
            infrastructure for that lands in v2.
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-4 text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
          >
            see pricing →
          </Link>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            06 · The endgame
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Plumbing, not destination.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Users don&apos;t sign up for Glurk. They never see Glurk. Apps query Glurk on
            their behalf with a one-tap consent banner — the same way an Indian fintech
            queries CIBIL, the same way a US lender queries Plaid. Most users never know
            the protocol exists. They just notice the next app understands them faster
            than the last.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            That&apos;s the goal: become so embedded in the read-and-write of every
            consumer-trust decision (and eventually every agent-trust decision) that
            opting out is more expensive than opting in. Standard infrastructure. The
            thing every app builds against and nobody talks about.
          </p>
        </section>

        <section className="rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70 mb-3">
            What we&apos;re betting on
          </p>
          <ol className="space-y-3 text-white/70 text-[15px] leading-relaxed list-none">
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">01</span>
              <span>
                On-chain identity is now cheap enough on Solana to be the substrate for a
                real consumer protocol, not a research project. ~0.002 SOL per credential
                at scale.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">02</span>
              <span>
                Reciprocal data is structurally better economics than extractive data.
                The apps building today choose it the moment a credible option exists,
                because the alternative is paying rent forever to an identity gatekeeper.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">03</span>
              <span>
                AI agents are the second consumer of identity, not an afterthought. Every
                agent that transacts needs to prove it&apos;s real, audited, capitalized,
                and previously honest. Glurk credentials apply identically to wallets
                whether a human or agent owns them.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">04</span>
              <span>
                India is the unfair advantage. Built here, scaled out. Indian fintech is
                the most credential-hungry market on earth, and Indian Gen Z carries
                wallets natively.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">05</span>
              <span>
                The first protocol to ship issuer count, score transparency, viral
                consumer surface, b2b distribution mechanism, and a real revenue model —
                at the same time — wins the category. We have the first four shipped and
                the fifth in the door.
              </span>
            </li>
          </ol>
        </section>

        <section className="text-center pt-4">
          <p className="text-white/55 text-[15px] leading-relaxed mb-6">
            If you&apos;re building something that needs to verify a person, a developer,
            a borrower, a contributor, or an AI agent without trusting their resume, an
            API, or a platform — we want to be your identity layer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/issuers/register"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
            >
              Become an issuer →
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold text-white/80"
            >
              Build on the protocol →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">written by the founder</span>
        </div>
      </footer>
    </div>
  );
}
