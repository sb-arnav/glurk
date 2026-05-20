import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import ThanksPolling from "@/app/components/ThanksPolling";

export const metadata: Metadata = {
  title: "Thanks · Glurk",
  description: "Your Glurk Pro key is being provisioned.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ paddle_txn?: string }>;

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { paddle_txn: txn } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
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

      <main className="max-w-xl mx-auto px-6 py-16">
        {txn ? (
          <ThanksPolling transactionId={txn} />
        ) : (
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <p className="text-white/55 text-sm">
              No checkout reference in this URL. If you just paid and didn&apos;t land
              here automatically, check your email or{" "}
              <a
                href="mailto:arnavmaurya.am@gmail.com?subject=Glurk · checkout reference missing"
                className="text-[#7B6FF8] hover:text-white transition-colors"
              >
                contact us
              </a>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
