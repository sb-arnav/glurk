import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import KeyUsagePanel from "@/app/components/KeyUsagePanel";

export const metadata: Metadata = {
  title: "Your API key · Glurk",
  description:
    "View your Glurk API key usage, monthly quota, and reset date. Self-serve, no login.",
  robots: { index: false, follow: false },
};

export default function KeysDashboardPage() {
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
            docs →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            Dashboard
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            Your API key
          </h1>
          <p className="text-white/55 text-[15px] leading-relaxed max-w-2xl">
            Paste your <code className="font-mono text-white/75">glk_…</code> key to see
            your monthly usage, tier, and reset date. There&apos;s no login — possession
            of the key is the credential, same as when you make API calls.
          </p>
        </div>

        <KeyUsagePanel />

        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 text-[12px] text-white/45 leading-relaxed">
          <p className="mb-2 text-white/65 font-bold text-[13px]">Need a new key?</p>
          <p>
            Free tier (1k calls/month) provisions instantly. Pro and Enterprise are
            billed via Paddle.
          </p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <Link
              href="/pricing"
              className="text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
            >
              see pricing →
            </Link>
            <Link
              href="/docs"
              className="text-[12px] font-mono text-white/40 hover:text-white transition-colors"
            >
              integration docs →
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">/dashboard/keys</span>
        </div>
      </footer>
    </div>
  );
}
