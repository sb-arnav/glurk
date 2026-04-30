import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import PricingSignup from "@/app/components/PricingSignup";

export const metadata: Metadata = {
  title: "Glurk Pricing · Free chain access. Hosted API tiers.",
  description:
    "The Glurk chain is free for anyone to read. The hosted convenience API has free + paid tiers for production traffic. Built like Plaid sits on top of bank APIs.",
};

const TIERS = [
  {
    name: "Chain Access",
    price: "Free, forever.",
    sub: "Read directly from Solana — no key, no quota.",
    quota: "Unlimited",
    features: [
      "@glurk-protocol/sdk",
      "Direct Solana RPC access",
      "All credential PDAs are public",
      "No protocol gating",
    ],
    cta: { label: "Read the docs", href: "/docs" },
    accent: "neutral" as const,
  },
  {
    name: "Free Hosted API",
    price: "$0/mo",
    sub: "1,000 hosted calls / month, no credit card.",
    quota: "1,000",
    features: [
      "GET /api/v1/check (cached, fast)",
      "Email lookup support",
      "X-Glurk-Tier headers for ops",
      "Self-serve key in 30 seconds",
    ],
    cta: { kind: "signup" as const, tier: "free" as const },
    accent: "primary" as const,
  },
  {
    name: "Pro",
    price: "$49/mo",
    sub: "50,000 calls / month. For production apps.",
    quota: "50,000",
    features: [
      "Higher monthly quota",
      "Priority support",
      "Webhook delivery (coming)",
      "Usage analytics dashboard",
    ],
    cta: { kind: "signup" as const, tier: "pro" as const },
    accent: "primary" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "1M+ calls / month. Custom SLAs.",
    quota: "1M+",
    features: [
      "Dedicated infra option",
      "99.9% uptime SLA",
      "Custom rate limits",
      "Direct Slack with founders",
    ],
    cta: { label: "Contact us", href: "mailto:founder@glurk.protocol?subject=Glurk Enterprise" },
    accent: "neutral" as const,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <Link
            href="/docs"
            className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            docs →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            Free chain. Paid hosted API.
          </h1>
          <p className="text-white/55 text-[15px] leading-relaxed">
            The Glurk protocol on Solana is permanently free — anyone can read program
            accounts directly with zero cost beyond standard RPC. The hosted convenience
            API at <code className="font-mono text-white/75">glurk.slayerblade.site</code>{" "}
            sits on top with caching, email lookups, and managed quotas. That&apos;s
            where the business model lives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-[24px] border p-6 flex flex-col ${
                tier.accent === "primary"
                  ? "border-[#5B4FE8]/[0.3] bg-[#5B4FE8]/[0.06] shadow-[0_18px_40px_rgba(91,79,232,0.18)]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <p
                className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${
                  tier.accent === "primary" ? "text-[#7B6FF8]" : "text-white/30"
                }`}
              >
                {tier.name}
              </p>
              <p className="text-2xl font-black mb-1">{tier.price}</p>
              <p className="text-[12px] text-white/45 mb-4 leading-relaxed">{tier.sub}</p>
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-3">
                Monthly quota: <span className="text-white/60">{tier.quota}</span>
              </p>
              <ul className="space-y-1.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="text-[12px] text-white/55 flex items-start gap-2">
                    <span className="text-[#7B6FF8] shrink-0">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {"kind" in tier.cta && tier.cta.kind === "signup" ? (
                <PricingSignup tier={tier.cta.tier} />
              ) : (
                <a
                  href={tier.cta.href}
                  className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    tier.accent === "primary"
                      ? "bg-[#5B4FE8] hover:bg-[#6B5FF8] text-white"
                      : "bg-white/[0.05] border border-white/[0.1] text-white/80 hover:bg-white/[0.08]"
                  }`}
                >
                  {tier.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>

        <section className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
              Why pay for hosted?
            </p>
            <p className="text-[13px] text-white/55 leading-relaxed">
              Cached responses (~30s edge cache), email→wallet resolution, no Solana
              RPC keys to manage, monthly usage analytics. For production apps that
              don&apos;t want to babysit chain reads.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
              Why is the chain free?
            </p>
            <p className="text-[13px] text-white/55 leading-relaxed">
              Because credentials only have value if anyone can verify them without
              asking permission. The chain is the moat. The hosted API is the cash
              register that sits beside it — like Plaid sitting beside bank APIs.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
              What about issuers?
            </p>
            <p className="text-[13px] text-white/55 leading-relaxed">
              Becoming an issuer is permissionless and free (you pay only ~0.002 SOL
              of devnet rent). The protocol does not charge issuers. Hosted-API
              monetization is reader-side only.
            </p>
          </div>
        </section>

        <section className="mt-16 text-center">
          <p className="text-[12px] font-mono text-white/30 mb-3">Questions?</p>
          <a
            href="mailto:founder@glurk.protocol"
            className="text-[14px] text-[#7B6FF8] hover:text-white transition-colors"
          >
            founder@glurk.protocol →
          </a>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <Link href="/docs" className="font-mono hover:text-white/50 transition-colors">
            docs →
          </Link>
        </div>
      </footer>
    </div>
  );
}
