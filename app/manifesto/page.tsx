import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Glurk Manifesto",
  description:
    "Empires fall. Protocols don't. The internet's identity gatekeepers are unbundling. Glurk is the protocol that takes their place — verified, reciprocal, owned by the people it's about.",
  openGraph: {
    title: "The Glurk Manifesto",
    description: "Empires fall. Protocols don't.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Glurk Manifesto",
    description: "Empires fall. Protocols don't.",
  },
};

const USE_CASES: Array<{ vertical: string; one_liner: string; example: string }> = [
  {
    vertical: "Lending & credit",
    one_liner:
      "Underwrite users without a credit file. Read verified financial-literacy and behavior credentials directly.",
    example: "Indian fintechs underwriting Gen Z. BNPL on first-loan customers. Crypto-native lenders pricing risk on Glurk Score.",
  },
  {
    vertical: "Hiring & professional networks",
    one_liner:
      "Replace the resume. Verified skills, course completions, contribution history — readable by anyone, owned by the candidate.",
    example: "Recruiters filter inbound by a wallet's verified credentials. Freelance platforms gate listings by Glurk Score. DAOs verify contributor history.",
  },
  {
    vertical: "Education & certifications",
    one_liner:
      "Issuers turn course completions into permanent, portable credentials. Every learner carries them across every app.",
    example: "Bootcamps issuing on-chain. Skill-assessment platforms issuing per-test. Universities testing degree-issuance pilots.",
  },
  {
    vertical: "DeFi & DAOs",
    one_liner:
      "Protocols read reputation directly from chain instead of voting weights and TVL alone.",
    example: "Undercollateralized lending. Reputation-weighted governance. Allowlisted drops by credential type. DEX market-making by trust score.",
  },
  {
    vertical: "AI agent identity",
    one_liner:
      "When agents transact with each other and with humans, they need credentials. Glurk applies identically to wallets a human or an agent owns.",
    example: "Agent has shipped 200 verified jobs. Agent passed audit X. Agent has Y in escrow. Agent's principal is verifiably this human.",
  },
  {
    vertical: "Insurance",
    one_liner:
      "Risk-tier policies by credential type instead of legacy demographic proxies.",
    example: "Health credentials affecting premiums. Driving record affecting auto. Verified financial responsibility affecting life insurance.",
  },
  {
    vertical: "Gaming & esports",
    one_liner:
      "Achievements, ranks, and anti-cheat reputation that travels across games.",
    example: "Top-1% rank credential issued by League. Verified pro contract. Anti-cheat record portable across studios.",
  },
  {
    vertical: "Healthcare",
    one_liner:
      "Verified medical credentials for professionals, vaccination records for users, consent on-chain.",
    example: "Doctor's license issued by board. Patient consent records. Vaccination verifiable without server-side databases.",
  },
  {
    vertical: "Real estate & rentals",
    one_liner:
      "Tenant rental history portable between landlords. Landlord reputation portable between tenants.",
    example: "On-time payment streak credential. Verified previous-tenant reference. Property condition credentials at move-in / move-out.",
  },
  {
    vertical: "Loyalty & community",
    one_liner:
      "Cross-brand loyalty without a coalition. Discord/Telegram reputation that survives platform migrations.",
    example: "Verified expert badges. Subscriber-tenure credentials. Cross-brand spend signals.",
  },
];

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
            Manifesto · v2.0
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <section>
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            The Thesis
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.02] mb-6">
            Empires fall.{" "}
            <span className="text-[#5B4FE8]">Protocols don&apos;t.</span>
          </h1>
          <p className="text-white/65 text-[16px] leading-[1.7]">
            The companies that hold the world&apos;s identity look permanent. CIBIL.
            Plaid. LinkedIn. Google. Facebook. Each of them owns a slice of you and
            rents it back to every app that needs to know who you are. They feel like
            infrastructure. They&apos;re empires.
          </p>
          <p className="text-white/65 text-[16px] leading-[1.7] mt-4">
            Empires fade. The Roman roads outlasted Rome. TCP/IP outlasted whatever the
            ARPA scientists thought they were doing. Stripe outlasted being &quot;a way
            to take payments online.&quot; The infrastructure underneath is what
            survives.
          </p>
          <p className="text-white/85 text-[18px] leading-[1.6] mt-6 font-semibold">
            Identity is unbundling. We&apos;re building what comes next.
          </p>
        </section>

        <section>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
              What&apos;s actually happening
            </p>
            <p className="text-white/65 text-[15px] leading-relaxed mb-3">
              Every app you&apos;ve ever used rebuilds identity from scratch:
            </p>
            <ul className="space-y-2 text-[14px] text-white/55 leading-relaxed">
              <li>· Its own KYC</li>
              <li>· Its own scoring</li>
              <li>· Its own anti-fraud</li>
              <li>· Its own resume parser</li>
              <li>· Its own reputation system</li>
              <li>· Its own &quot;verify your phone, your email, your address again&quot;</li>
            </ul>
            <p className="text-white/65 text-[15px] leading-relaxed mt-4">
              Some bigger apps got tired of this and started renting it out. That&apos;s
              what Plaid is. That&apos;s what CIBIL is. That&apos;s what every &quot;Sign
              in with X&quot; button is. Identity is being held hostage by a small set
              of platforms that decided to charge other apps for access to it.
            </p>
            <p className="text-white/85 text-[15px] leading-relaxed mt-4 font-semibold">
              That&apos;s a market structure, not an architecture. The architecture is a
              protocol — owned by no one, written into by anyone trusted, read by every
              app that needs a decision.
            </p>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            01 · The mechanism
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Reciprocal data exchange. Enforced by the chain.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            CIBIL works because of one rule: you can&apos;t pull a credit report unless
            you also contribute one. Every participant pays in to take out. Free-riders
            don&apos;t exist because the system won&apos;t serve them.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            We took that rule and put it in a Solana program. To read a user&apos;s
            credentials, an app calls{" "}
            <code className="text-[13px] font-mono text-[#A79EFF] bg-[#5B4FE8]/[0.1] px-1.5 py-0.5 rounded">
              request_access
            </code>
            , which atomically writes the app&apos;s data contribution back to the
            user&apos;s profile and creates a consent record the user must sign. No
            consent, no read. No contribution, no read. Both, atomically. Three lines of
            Rust enforce what entire CIBIL/Plaid contract teams enforce in legal
            agreements that nobody reads.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Centralized identity APIs become extractive at scale — the bigger they get,
            the more leverage they have over the apps reading from them. Glurk inverts
            it: every read makes the network richer for everyone, not poorer for the app.
            The protocol can&apos;t become a tax.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            02 · Where this lands
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Anything that requires trusting a person.
          </h2>
          <p className="text-white/55 text-[15px] leading-[1.7] mb-5">
            The same primitive — a verified credential PDA + reciprocal access flow —
            applies wherever the internet has to make a decision about a human (or, soon,
            an AI agent acting for one).
          </p>
          <div className="space-y-3">
            {USE_CASES.map((u) => (
              <div
                key={u.vertical}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <p className="font-bold text-[15px] mb-1.5">{u.vertical}</p>
                <p className="text-[13px] text-white/60 leading-relaxed mb-2">
                  {u.one_liner}
                </p>
                <p className="text-[12px] text-white/40 leading-relaxed">
                  <span className="text-white/55 font-semibold">Where it shows up first:</span>{" "}
                  {u.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            03 · The wedge
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            India Gen Z, financial literacy, on Staq.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Universal protocols don&apos;t launch universal. They launch in a corner where
            the existing infrastructure is so broken that even an imperfect first version
            is obviously better — and where users are digital-native enough to carry
            credentials forward.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            India has 500M people under 25. CIBIL has no file on them. The financial
            system underwrites them like strangers and rejects 30–50% of them on bad
            heuristics. Manual KYC costs ₹500–2,000 per approved user. We start there.
            Staq issues credentials when users complete real financial-literacy modules.
            Those credentials unlock lower collateral on a lending app, faster KYC on a
            fintech, a verified profile on a job platform, in any of the verticals above.
          </p>
          <p className="text-white/85 text-[15px] leading-[1.7] mt-4 font-semibold">
            One issuer is a closed loop. Two is a network. Ten is a moat. A hundred is a
            protocol no platform can ever displace.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            04 · The unit of trust
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Credentials are the atom. Score is the abstraction.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Each credential is a non-transferable Token-2022 mint with a Solana PDA
            encoding the issuer, user, slug, tier, and per-module score. Auditable on
            chain by anyone. The math that turns N credentials into a 0–1000 Glurk Score
            is published, deterministic, and computable from chain data without an API.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            We don&apos;t hide the formula behind a login wall. Credibility comes from
            saying what&apos;s included and what isn&apos;t. The score is exactly the sum
            of what registered issuers have signed about you. Nothing else.
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
            05 · The business
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Free chain. Paid hosted layer. The Plaid playbook.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            The Solana program is permanently free. Anyone reads program accounts at zero
            cost. The chain is the moat — credentials only have value if anyone can
            verify them without permission.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            The hosted convenience layer at{" "}
            <code className="text-[13px] font-mono text-white/75">
              glurk.slayerblade.site
            </code>{" "}
            is where production traffic lives — caching, email lookups, monthly quotas,
            SLAs, the polish nobody wants to operate themselves. Free tier (1k
            calls/month), Pro ($49), Enterprise (custom). On-chain protocol fees land in
            v2 for the institutional read path.
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
            06 · Why now
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Three forces that didn&apos;t exist together until 2025.
          </h2>
          <ul className="space-y-3 text-white/65 text-[15px] leading-relaxed">
            <li>
              <span className="text-white/85 font-semibold">Solana is fast and cheap enough.</span>{" "}
              Identity at 50ms reads and ~$0.0002 writes is now cheaper than the
              database query an enterprise SaaS does to its own Postgres. The substrate
              for consumer-scale identity finally exists.
            </li>
            <li>
              <span className="text-white/85 font-semibold">AI agents are about to need this.</span>{" "}
              Agents will transact at trillions of dollars of volume. They have no
              credential layer. Whoever ships it first owns a piece of every agent
              transaction for the next century. We&apos;re aimed there.
            </li>
            <li>
              <span className="text-white/85 font-semibold">Wallets are becoming user accounts.</span>{" "}
              Every Solana mobile user, every Phantom install, every wallet-connected
              app is a user account that maps 1:1 to a Glurk profile. The substrate
              compounds with crypto adoption itself.
            </li>
          </ul>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            07 · The endgame
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Plumbing. Not destination.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Users don&apos;t sign up for Glurk. They never see Glurk. Apps query Glurk on
            their behalf with a one-tap consent banner — the same way an Indian fintech
            queries CIBIL, the same way a US lender queries Plaid. Most users never know
            the protocol exists. They just notice the next app understands them faster
            than the last one.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            We get embedded so deeply in the read-and-write of every consumer-trust
            decision (and eventually every agent-trust decision) that opting out is more
            expensive than opting in. Standard infrastructure. The thing every app
            builds against and nobody talks about. Plumbing.
          </p>
        </section>

        <section className="rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70 mb-3">
            What we&apos;re betting on
          </p>
          <ol className="space-y-3 text-white/70 text-[15px] leading-relaxed">
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">01</span>
              <span>
                Identity is the last unbundled layer of the consumer internet. The
                economic gravity of unbundling it is irresistible — the only question is
                who builds the layer that takes its place.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">02</span>
              <span>
                Reciprocal data is structurally better economics than extractive data.
                Apps choose it the moment a credible alternative exists, because the
                alternative is paying rent forever to an identity gatekeeper.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">03</span>
              <span>
                AI agents are the second consumer of identity, not an afterthought. Glurk
                credentials apply identically to wallets a human or agent owns.
                We&apos;re early in human identity to be ready when agent identity
                arrives.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">04</span>
              <span>
                India is the unfair advantage. The most credential-hungry market on
                earth, with Gen Z that carries wallets natively. Built here, scales out.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">05</span>
              <span>
                The first protocol to ship issuer count, score transparency, viral
                consumer surface, b2b distribution, and a real revenue model — at the
                same time — wins the category. We have all five, today.
              </span>
            </li>
          </ol>
        </section>

        <section className="text-center pt-4">
          <p className="text-white/55 text-[15px] leading-relaxed mb-6">
            If you&apos;re building anything that has to trust a person — to lend, hire,
            insure, vouch, certify, gate, route, recommend, deliver, refund, or grant
            access — we want to be the layer underneath your decision.
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

        <section className="text-[11px] font-mono text-white/25 leading-relaxed border-t border-white/[0.04] pt-6">
          <p>
            <span className="text-white/45">Field notes:</span> The Foundation series for
            &quot;empires fall, protocols don&apos;t.&quot; The Social Network for
            network-effect founder energy. Stripe for the manifesto cadence. Plaid for
            the business model. CIBIL for the mechanism. None of which we are. All of
            which we&apos;re learning from.
          </p>
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
