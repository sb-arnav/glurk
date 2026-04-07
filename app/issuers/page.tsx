import Link from "next/link";
import Image from "next/image";

const PROGRAM_ID = "5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ";

export const metadata = {
  title: "Become an Issuer — Glurk Protocol",
  description:
    "Issue verifiable on-chain credentials to your users. Build on the Glurk identity protocol.",
};

export default function IssuersPage() {
  return (
    <div className="min-h-screen text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={24} height={24} />
            <span className="text-sm font-semibold text-white/50">Glurk Protocol</span>
          </Link>
          <a
            href="https://github.com/sb-arnav/glurk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors font-mono"
          >
            GitHub ↗
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-3 py-1 text-[11px] font-mono tracking-widest uppercase text-[#A79EFF] mb-6">
            Issuer Program
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-5 leading-[1.05]">
            Issue credentials.<br />
            <span className="text-[#7B6FF8]">Build reputation infrastructure.</span>
          </h1>
          <p className="text-lg text-white/45 leading-relaxed">
            Glurk issuers write verifiable facts about users to Solana. Every credential
            you issue becomes part of a portable identity that follows users across every
            app in the network.
          </p>
        </div>

        {/* What issuers get */}
        <section className="mb-16">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-6">
            What issuers get
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Permanent record",
                body: "Credentials live on Solana. Your users carry them forever, even if they stop using your app.",
              },
              {
                title: "Cross-app value",
                body: "Credentials issued by you become usable by every other Glurk-integrated app — DeFi, hiring, DAOs.",
              },
              {
                title: "Reciprocal data",
                body: "Every app that reads your users' credentials must contribute data back. Your users' profiles get richer over time.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
              >
                <p className="font-bold text-[15px] mb-2">{title}</p>
                <p className="text-sm text-white/40 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Integration */}
        <section className="mb-16">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-6">
            Integration
          </p>
          <div className="space-y-3">
            {[
              {
                step: "01",
                title: "Register as an issuer",
                body: "Call register_issuer with your wallet as the authority. This creates an IssuerAccount PDA on-chain.",
                code: `await program.methods\n  .registerIssuer("Your App Name")\n  .accounts({ issuerAuthority: wallet.publicKey })\n  .rpc();`,
              },
              {
                step: "02",
                title: "Issue credentials",
                body: "When a user earns a credential in your app, call register_credential. Each credential is a Token-2022 non-transferable SBT.",
                code: `await program.methods\n  .registerCredential(slug, tier, score, mintAddress)\n  .accounts({\n    issuerAuthority: wallet.publicKey,\n    user: userWallet,\n  })\n  .rpc();`,
              },
              {
                step: "03",
                title: "Read with the SDK",
                body: "Use @glurk/sdk to read any user's profile in your app, including credentials from all issuers.",
                code: `import { getProfile, KNOWN_ISSUERS } from '@glurk/sdk';\n\nconst { credentials, glurkScore } =\n  await getProfile(connection, userWallet);`,
              },
            ].map(({ step, title, body, code }) => (
              <div
                key={step}
                className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_16px_36px_rgba(6,5,18,0.2)]"
              >
                <div className="flex gap-6">
                  <p className="text-[10px] font-mono tracking-widest uppercase text-[#7B6FF8]/50 shrink-0 pt-0.5">
                    {step}
                  </p>
                  <div className="flex-1">
                    <p className="font-bold text-[15px] mb-1">{title}</p>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">{body}</p>
                    <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 font-mono text-xs text-white/50 whitespace-pre leading-relaxed">
                      {code}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Credential types */}
        <section className="mb-16">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-6">
            Credential tiers
          </p>
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_16px_36px_rgba(6,5,18,0.2)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { tier: "Platinum", weight: 100, color: "#E5E4E2", example: "Mastery-level" },
                { tier: "Gold", weight: 75, color: "#FFD700", example: "Advanced" },
                { tier: "Silver", weight: 50, color: "#C0C0C0", example: "Intermediate" },
                { tier: "Bronze", weight: 25, color: "#CD7F32", example: "Foundational" },
              ].map(({ tier, weight, color, example }) => (
                <div key={tier} className="text-center">
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
                  >
                    {weight}
                  </div>
                  <p className="text-sm font-semibold" style={{ color }}>{tier}</p>
                  <p className="text-[11px] text-white/25 mt-0.5">{example}</p>
                  <p className="text-[10px] font-mono text-white/15 mt-1">weight × score/100</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-white/[0.05]">
              <p className="text-xs text-white/30 leading-relaxed">
                <span className="text-white/50 font-semibold">Glurk Score</span> is calculated across all credentials from all issuers:
                each credential contributes <span className="font-mono">tier_weight × (score / 100)</span> points, capped at 1000.
                Platinum credentials with a score of 100 contribute 100 points each.
              </p>
            </div>
          </div>
        </section>

        {/* Program details */}
        <section className="mb-16">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-6">
            Protocol reference
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0D0A1F] p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-3">Program ID</p>
              <p className="font-mono text-xs text-[#A79EFF] break-all">{PROGRAM_ID}</p>
              <a
                href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/20 hover:text-white/40 transition-colors font-mono mt-2 block"
              >
                View on Solana Explorer ↗
              </a>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-[#0D0A1F] p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-3">Instructions</p>
              <div className="space-y-1.5">
                {[
                  "register_issuer",
                  "register_credential",
                  "request_access",
                  "revoke_access",
                ].map((ix) => (
                  <p key={ix} className="font-mono text-xs text-white/50">
                    <span className="text-[#7B6FF8]/60">fn </span>{ix}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-[28px] border border-[#5B4FE8]/[0.15] bg-[#5B4FE8]/[0.06] p-8 shadow-[0_20px_48px_rgba(91,79,232,0.14)]">
          <h2 className="text-2xl font-black mb-2">Ready to integrate?</h2>
          <p className="text-white/40 leading-relaxed mb-6 max-w-xl">
            The protocol is live on Solana devnet. The SDK is open source.
            Start issuing credentials and get listed as an official Glurk issuer.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/sb-arnav/glurk/tree/main/packages/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#5B4FE8] text-white text-sm font-bold hover:bg-[#6B5FF8] transition-colors"
            >
              SDK on GitHub ↗
            </a>
            <a
              href="https://github.com/sb-arnav/glurk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/70 text-sm font-semibold hover:bg-white/[0.08] transition-colors"
            >
              Full protocol docs ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
