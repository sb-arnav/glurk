import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Glurk Manifesto",
  description:
    "Credit bureaus solved capital. Glurk solves skill. A universal, reciprocal, on-chain identity layer for proving what you know — without trusting a resume, an API, or a platform.",
  openGraph: {
    title: "The Glurk Manifesto",
    description:
      "Credit bureaus solved capital. Glurk solves skill.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Glurk Manifesto",
    description:
      "Credit bureaus solved capital. Glurk solves skill.",
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
            Manifesto · v0.1
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <section>
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            The Thesis
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-6">
            Credit bureaus solved capital.{" "}
            <span className="text-[#5B4FE8]">Glurk solves skill.</span>
          </h1>
          <p className="text-white/65 text-[16px] leading-[1.7]">
            Before CIBIL and FICO, banks had to underwrite every loan from scratch.
            They&apos;d ask for letters from your employer, statements from your other
            banks, references from people who could vouch for you. Lending was slow,
            biased, and impossibly expensive at scale.
          </p>
          <p className="text-white/65 text-[16px] leading-[1.7] mt-4">
            Then someone built a shared register. A neutral piece of infrastructure
            where every lender wrote what they observed and every lender could read
            what others had written. Underwriting collapsed from weeks to seconds. A
            new financial economy unlocked behind it.
          </p>
          <p className="text-white/85 text-[18px] leading-[1.6] mt-6 font-semibold">
            Skill is where capital was a hundred years ago.
          </p>
        </section>

        <section>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
              The problem we&apos;re fixing
            </p>
            <ul className="space-y-3 text-white/60 text-[15px] leading-relaxed">
              <li>
                · A user finishes a finance course on app A. App B has no idea.
              </li>
              <li>
                · A developer&apos;s GitHub history exists. The lender has to scrape it
                themselves.
              </li>
              <li>
                · A trader has 5 years of profitable activity. The next exchange treats
                them like a stranger.
              </li>
              <li>
                · A recruiter wants verified skills. They get a PDF resume.
              </li>
            </ul>
            <p className="text-white/45 text-[14px] mt-4 leading-relaxed">
              Every app rebuilds identity from zero, every time. The user pays for it
              in friction. The platform pays for it in conversion. The economy pays
              for it in trust.
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
            The reason CIBIL works isn&apos;t the database. It&apos;s the rule that
            you can&apos;t pull a credit report unless you also contribute one. Every
            participant pays in to take out. Free-riders don&apos;t exist because
            the protocol won&apos;t serve them.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Glurk encodes that rule into a Solana program. To read a credential, an
            app calls{" "}
            <code className="text-[13px] font-mono text-[#A79EFF] bg-[#5B4FE8]/[0.1] px-1.5 py-0.5 rounded">
              request_access
            </code>{" "}
            — which atomically writes the app&apos;s contribution back to the
            user&apos;s profile and creates a consent record the user must sign. No
            consent, no read. No contribution, no read. Both, atomically.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            Centralized identity APIs end up as data extractors. The bigger they get,
            the more leverage they have over the apps reading from them. Glurk
            inverts that — every read makes the network richer for everyone, not
            poorer for the app.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            02 · The unit of trust
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Credentials are the atom. Score is the abstraction.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Each credential is a non-transferable Token-2022 mint with a PDA that
            encodes the issuer, the user, the slug, the tier, and a per-module score.
            The credential is auditable. The math that turns N credentials into a 0–1000
            Glurk Score is published, deterministic, and computable from chain data
            without an API.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            We don&apos;t hide the formula behind a login wall because credibility
            comes from saying what&apos;s included and what isn&apos;t. The score is
            exactly the sum of what registered issuers have signed about you. Nothing
            else.
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
            03 · The wedge
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Indian Gen Z, financial literacy, on Staq.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Universal protocols don&apos;t launch universal. They launch in a specific
            corner where the existing identity infrastructure is broken and the user
            base is digital-native enough to carry credentials forward.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            India has 500M Gen Z. The financial system underwrites them like
            strangers because there is no shared record of skill — academic or
            otherwise. We start there. Staq is the first issuer. Users earn Glurk
            credentials by completing real financial literacy modules. Then the same
            credential unlocks lower collateral on a lending app, faster KYC on a
            fintech, a verified profile on a job platform.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            One issuer is a closed loop. Two is a network. Ten is a moat.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            04 · The endgame
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-4">
            Identity infrastructure, not an app.
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.7]">
            Users don&apos;t sign up for Glurk. They never see Glurk. Apps query
            Glurk on their behalf with a one-tap consent banner — the same way an
            Indian fintech queries CIBIL today, the same way a US lender queries
            Plaid. Most users never know the protocol exists. They just notice that
            the next app understands them faster than the last one.
          </p>
          <p className="text-white/65 text-[15px] leading-[1.7] mt-4">
            That&apos;s the goal: become so embedded in the read-and-write of every
            consumer financial product that opting out is more expensive than
            opting in. Plumbing, not destination.
          </p>
        </section>

        <section className="rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70 mb-3">
            What we&apos;re betting on
          </p>
          <ol className="space-y-3 text-white/70 text-[15px] leading-relaxed list-none counter-reset-[item]">
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">01</span>
              <span>
                On-chain identity is now cheap enough on Solana to be the substrate
                for a real consumer protocol, not a research project.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">02</span>
              <span>
                Reciprocal data is a structurally better economic model than
                extractive data, and the apps building today will choose it the
                moment a credible option exists.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">03</span>
              <span>
                The first protocol to ship issuer count, score transparency, and a
                viral consumer surface — at the same time — wins the category.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#7B6FF8] font-mono text-[14px] shrink-0">04</span>
              <span>
                India is the unfair advantage. Built here, scales out.
              </span>
            </li>
          </ol>
        </section>

        <section className="text-center pt-4">
          <p className="text-white/55 text-[15px] leading-relaxed mb-6">
            If you&apos;re building something that needs to verify a person without
            trusting their resume, an API, or a platform — we want to be your
            identity layer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/issuers"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
            >
              Become an issuer →
            </Link>
            <Link
              href="/early-adopters"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold text-white/80"
            >
              See founding members →
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
