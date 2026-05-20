import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import UnderwritingDemo from "@/app/components/UnderwritingDemo";

export const metadata: Metadata = {
  title: "Glurk for Indian Fintechs · Underwrite Gen Z without CIBIL",
  description:
    "500M Indian Gen Z have no credit history. CIBIL can't underwrite them. Manual KYC costs ₹500-2000/user. Glurk credentials cost ₹0.01/lookup and tell you what they actually know.",
  openGraph: {
    title: "Glurk for Indian Fintechs",
    description:
      "Underwrite Gen Z in India without CIBIL or manual KYC. Verified financial literacy credentials, on-chain.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glurk for Indian Fintechs",
    description:
      "Underwrite Gen Z in India without CIBIL or manual KYC.",
  },
};

export default function ForFintechsPage() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <Link
            href="/docs"
            className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            full docs →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-12">
        <section>
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            For Indian fintechs
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-5">
            Underwrite Gen Z without{" "}
            <span className="text-[#5B4FE8]">CIBIL.</span>
          </h1>
          <p className="text-white/65 text-[16px] leading-[1.7]">
            500M Indians under 25 have no credit history. CIBIL has no file on them. You
            can&apos;t underwrite a loan, approve a credit card, or onboard them to
            trading without 30 minutes of manual KYC and a leap of faith. Glurk is the
            credential layer that fixes this. Verified financial literacy, signed by
            real issuers, on-chain, queryable in 50ms.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            01 · The math you already know
          </p>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-red-300/70 mb-1">
                  Today, per Gen Z user
                </p>
                <ul className="space-y-1.5 text-sm text-white/60">
                  <li>· Manual document KYC: ₹500–2,000</li>
                  <li>· Income proof verification: ₹200–500</li>
                  <li>· Phone/address verification: ₹100–300</li>
                  <li>· False-positive rejection rate: 30–50%</li>
                </ul>
                <p className="text-[12px] text-red-300/60 mt-3">
                  Total acquisition cost per approved user: <span className="font-bold">₹2,000–4,000</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#7B6FF8] mb-1">
                  With Glurk
                </p>
                <ul className="space-y-1.5 text-sm text-white/60">
                  <li>· One <code className="font-mono text-[#A79EFF]">/api/v1/check</code> call: ~₹0.01</li>
                  <li>· Returns Glurk Score 0-1000 + every credential</li>
                  <li>· No PII handling on your side</li>
                  <li>· Signed by real issuers (Staq, GitHub, more)</li>
                </ul>
                <p className="text-[12px] text-[#7B6FF8] mt-3">
                  Total signal cost: <span className="font-bold">~₹0.01 per check</span>
                </p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-white/[0.05]">
              <p className="text-sm text-white/60">
                A fintech approving 1,000 Gen Z users/month replaces ₹2-4 lakh in
                acquisition cost with a Glurk Pro subscription at ₹4,000/mo. ROI is
                immediate and obvious.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            02 · Drop-in code (works today)
          </p>
          <p className="text-white/55 text-[14px] leading-relaxed mb-3">
            From your Node backend, before approving a loan / opening an account /
            issuing a card:
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-5 text-[12px] text-white/80 leading-relaxed font-mono">
{`// 1. Check what Glurk knows about this user
const r = await fetch(
  \`https://glurk.slayerblade.site/api/v1/check?wallet=\${wallet}\`,
  { headers: { Authorization: \`Bearer \${process.env.GLURK_KEY}\` } }
);
const { glurkScore, credentials } = await r.json();

// 2. Apply your own underwriting policy
const hasFinlit = credentials.some(
  c => c.issuer === STAQ_ISSUER && c.tier !== "bronze"
);
const isCreditworthy = glurkScore >= 300 && hasFinlit;

if (isCreditworthy) {
  approve({ amount: 50_000, collateralRatio: 1.05 });
} else {
  fallbackToManualKyc();  // existing flow, only for the unverified
}`}
          </pre>
          <p className="text-[12px] text-white/35 mt-3 leading-relaxed">
            The chain is the source of truth. The hosted endpoint is cached + CORS-open
            so you can call it from any backend. SDK available too:{" "}
            <code className="font-mono text-white/60">npm i @glurk-protocol/sdk</code>
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            03 · See the decision live
          </p>
          <p className="text-white/55 text-[14px] leading-relaxed mb-4">
            Same call, same data, same result your backend would compute. Below runs
            against the production API right now — paste any wallet, watch the
            approve/fall-back decision land in &lt;100ms.
          </p>
          <UnderwritingDemo />
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            04 · What credentials look like
          </p>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-[12px] text-white/55 leading-relaxed mb-4">
              Staq is the first issuer — verified financial literacy modules completed
              by real Indian Gen Z users. Each module = one signed credential. Examples
              of what a typical user wallet would carry:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: "Credit Score Basics", tier: "Gold", color: "#FFD700" },
                { name: "Stock Market Basics", tier: "Gold", color: "#FFD700" },
                { name: "UPI Payments", tier: "Silver", color: "#C0C0C0" },
                { name: "Mutual Funds", tier: "Gold", color: "#FFD700" },
                { name: "Income Tax", tier: "Silver", color: "#C0C0C0" },
                { name: "SIP Basics", tier: "Silver", color: "#C0C0C0" },
                { name: "Index Funds", tier: "Gold", color: "#FFD700" },
                { name: "Financial Independence", tier: "Platinum", color: "#E5E4E2" },
              ].map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 flex items-center gap-2"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="text-[12px] text-white/75">{c.name}</span>
                  <span
                    className="ml-auto text-[10px] font-mono uppercase"
                    style={{ color: c.color }}
                  >
                    {c.tier}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-white/40 mt-4 leading-relaxed">
              Each credential is a non-transferable Token-2022 mint with a Solana PDA.
              You can verify any of them yourself by deriving the PDA — no API call
              required.
            </p>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            05 · What this unlocks for your product
          </p>
          <div className="space-y-3">
            {[
              {
                use: "Lending",
                body: "Lower collateral requirements for users with verified financial literacy. A user with Glurk Score ≥600 gets 105% collateral instead of 150%. Default rates drop because users with credentials self-select.",
              },
              {
                use: "Trading platforms",
                body: "Skip the F&O qualification quiz for users with verified Stock Market + Sell Rules credentials. Faster onboarding, fewer customer-support tickets, regulatory check satisfied via signed proof.",
              },
              {
                use: "Credit cards",
                body: "Approve thin-file Gen Z applicants with Platinum-tier finlit credentials. Replace 60% of CIBIL-blocked applications with a positive signal that no other bureau has.",
              },
              {
                use: "BNPL / consumer finance",
                body: "Underwrite first-loan customers without manual document KYC. Glurk Score is your soft underwriting input alongside transaction signals.",
              },
              {
                use: "Insurance",
                body: "Risk-tier health and life policies for Gen Z without medical history. Financial responsibility credentials correlate strongly with claim behavior.",
              },
            ].map((item) => (
              <div
                key={item.use}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <p className="font-bold text-[15px] mb-1.5">{item.use}</p>
                <p className="text-[13px] text-white/55 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70 mb-3">
            Pricing for fintechs
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-mono text-white/30 uppercase">Free tier</p>
              <p className="text-2xl font-black text-white">1,000<span className="text-sm text-white/40">/mo</span></p>
              <p className="text-[11px] text-white/45 mt-1">Build the integration, no credit card.</p>
            </div>
            <div>
              <p className="text-[11px] font-mono text-[#A79EFF] uppercase">Pro</p>
              <p className="text-2xl font-black text-white">$49<span className="text-sm text-white/40">/mo</span></p>
              <p className="text-[11px] text-white/45 mt-1">50,000 calls. Right-sized for an early-stage fintech.</p>
            </div>
            <div>
              <p className="text-[11px] font-mono text-white/30 uppercase">Enterprise</p>
              <p className="text-2xl font-black text-white">Custom</p>
              <p className="text-[11px] text-white/45 mt-1">1M+ calls/month, dedicated infra, SLA.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-5 text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
          >
            see full pricing →
          </Link>
        </section>

        <section className="text-center pt-4">
          <p className="text-white/55 text-[14px] mb-5 leading-relaxed">
            Building a fintech in India? Get a free key, integrate the
            5-line check above, and ship it behind a feature flag this week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-sm font-bold shadow-[0_18px_40px_rgba(91,79,232,0.32)]"
            >
              Get free API key →
            </Link>
            <a
              href="mailto:arnavmaurya.am@gmail.com?subject=Glurk integration · Indian fintech"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-sm font-semibold text-white/80"
            >
              Talk to the founder →
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <Link href="/docs" className="font-mono hover:text-white/50 transition-colors">
            integration docs →
          </Link>
        </div>
      </footer>
    </div>
  );
}
