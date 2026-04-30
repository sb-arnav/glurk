import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How Glurk Score Works",
  description:
    "Open formula. No black box. Glurk Score is a 0–1000 reputation number derived from your verified credentials, weighted by tier and issuer-assigned score. Anyone can compute it from chain data.",
  openGraph: {
    title: "How Glurk Score Works",
    description:
      "Open formula. No black box. Reputation derived from verified credentials on Solana.",
  },
};

const TIERS: Array<{ name: string; weight: number; color: string; example: string }> = [
  { name: "Platinum", weight: 100, color: "#E5E4E2", example: "Top-tier mastery" },
  { name: "Gold", weight: 75, color: "#FFD700", example: "Strong proficiency" },
  { name: "Silver", weight: 50, color: "#C0C0C0", example: "Working knowledge" },
  { name: "Bronze", weight: 25, color: "#CD7F32", example: "Foundational" },
];

const WORKED_EXAMPLES = [
  {
    label: "New user, one credential",
    items: [{ name: "Credit Score Basics", tier: "Bronze", score: 80 }],
    score: 25 * 0.8,
    explainer: "1 credential × 25 (bronze) × 0.80 = 20",
  },
  {
    label: "Active learner",
    items: [
      { name: "Credit Score Basics", tier: "Gold", score: 90 },
      { name: "Stock Market Basics", tier: "Silver", score: 75 },
      { name: "UPI Payments", tier: "Bronze", score: 100 },
    ],
    score: 75 * 0.9 + 50 * 0.75 + 25 * 1.0,
    explainer: "(75 × 0.90) + (50 × 0.75) + (25 × 1.00) = 67.5 + 37.5 + 25 = 130",
  },
  {
    label: "Power user across issuers",
    items: [
      { name: "Credit Score Basics", tier: "Platinum", score: 100 },
      { name: "Stock Market Basics", tier: "Platinum", score: 95 },
      { name: "Sell Rules", tier: "Gold", score: 88 },
      { name: "Developer Reputation", tier: "Gold", score: 90 },
      { name: "On-Chain Activity", tier: "Silver", score: 70 },
    ],
    score: 100 * 1.0 + 100 * 0.95 + 75 * 0.88 + 75 * 0.9 + 50 * 0.7,
    explainer:
      "100 + 95 + 66 + 67.5 + 35 = 363.5 → still room to climb to 1000 with more credentials",
  },
];

export default function ScorePage() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Open Formula
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
          How the score works
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">
          Glurk Score is a <span className="text-[#5B4FE8]">single number</span>, not a black box.
        </h1>
        <p className="text-white/55 text-[15px] leading-relaxed mb-2">
          A 0–1000 reputation number derived from your verified credentials. Issuers write
          credentials with a tier and a per-module score. Glurk weighs them into one number anyone
          can compute from chain data — no API key, no opaque ranking, no scoring model behind a
          login wall.
        </p>
        <p className="text-white/40 text-sm leading-relaxed">
          Like CIBIL or FICO, but the formula is published, the inputs are signed by the issuer,
          and the output is reproducible by reading Solana directly.
        </p>

        <section className="mt-12 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 shadow-[0_18px_40px_rgba(6,5,18,0.22)]">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            The formula
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[13px] text-white/80 leading-relaxed font-mono">
{`glurkScore = min(
  1000,
  round(
    sum over credentials of
      tierWeight(tier) * (moduleScore / 100)
  )
)

tierWeight(t) =
  platinum -> 100
  gold     ->  75
  silver   ->  50
  bronze   ->  25
  unknown  ->  25  (default)`}
          </pre>
          <p className="text-[12px] text-white/35 leading-relaxed mt-3">
            Implementation:{" "}
            <a
              href="https://github.com/sb-arnav/glurk/blob/main/packages/sdk/src/index.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7B6FF8] hover:text-white transition-colors font-mono"
            >
              calcGlurkScore() in @glurk-protocol/sdk ↗
            </a>
            . Same code runs on the homepage, the profile, and every third-party app reading the
            chain.
          </p>
        </section>

        <section className="mt-10">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Tier weights
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: tier.color }}
                  />
                  <div>
                    <p className="font-semibold text-sm">{tier.name}</p>
                    <p className="text-[11px] text-white/30">{tier.example}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-white/70">{tier.weight}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-white/30 mt-3">
            Per-credential contribution = tier weight × (module score / 100). A perfect Bronze
            credential adds 25 to your score. A perfect Platinum adds 100.
          </p>
        </section>

        <section className="mt-12">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Worked examples
          </p>
          <div className="space-y-4">
            {WORKED_EXAMPLES.map((example) => (
              <div
                key={example.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white/80">{example.label}</p>
                  <p className="text-2xl font-black text-[#7B6FF8]">
                    {Math.min(1000, Math.round(example.score))}
                  </p>
                </div>
                <div className="space-y-1.5 mb-3">
                  {example.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-[12px] text-white/45"
                    >
                      <span>{item.name}</span>
                      <span className="font-mono">
                        {item.tier} · {item.score}/100
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-mono text-white/30">{example.explainer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-6">
          <p className="text-[10px] font-mono tracking-widest uppercase text-[#7B6FF8]/60 mb-3">
            What the score does NOT include
          </p>
          <ul className="space-y-2 text-sm text-white/55">
            <li>· Wallet balance, token holdings, or NFT collection</li>
            <li>· Transaction history or on-chain activity outside Glurk</li>
            <li>· Social signals from off-chain platforms</li>
            <li>· Any data Glurk did not receive a signed credential for</li>
          </ul>
          <p className="text-[12px] text-white/35 leading-relaxed mt-4">
            The score is exactly the sum of what registered issuers have signed about you.
            Nothing else.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/issuers"
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.15] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">
              For issuers
            </p>
            <p className="text-[15px] font-bold mb-1">Become an issuer →</p>
            <p className="text-[12px] text-white/40">
              Issue credentials your users carry across every app on the protocol.
            </p>
          </Link>
          <Link
            href="/profile"
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.15] transition-colors"
          >
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">
              For users
            </p>
            <p className="text-[15px] font-bold mb-1">See your Glurk →</p>
            <p className="text-[12px] text-white/40">
              Connect your wallet to view credentials and your live score from devnet.
            </p>
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">open formula · open chain</span>
        </div>
      </footer>
    </div>
  );
}
