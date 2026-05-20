"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status =
  | { kind: "polling" }
  | { kind: "ready"; key: string; tier: string; quota: number; email: string }
  | { kind: "timeout" }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 30; // ~75s before we give up and tell the user to email us

export default function ThanksPolling({ transactionId }: { transactionId: string }) {
  const [status, setStatus] = useState<Status>({ kind: "polling" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function tick() {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(
          `/api/paddle/checkout-status?txn=${encodeURIComponent(transactionId)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "completed" && data.key) {
          setStatus({
            kind: "ready",
            key: data.key,
            tier: data.tier,
            quota: data.monthlyQuota ?? 0,
            email: data.email,
          });
          return;
        }
      } catch (e) {
        if (cancelled) return;
        console.error("checkout-status poll failed:", (e as Error).message);
      }

      if (attempts >= MAX_POLLS) {
        if (!cancelled) setStatus({ kind: "timeout" });
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy your API key:", key);
    }
  }

  if (status.kind === "polling") {
    return (
      <div className="rounded-[24px] border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-8 text-center">
        <div className="inline-block w-10 h-10 rounded-full border-2 border-[#5B4FE8]/30 border-t-[#5B4FE8] animate-spin mb-5" />
        <p className="text-lg font-bold text-white mb-2">Provisioning your Glurk Pro key…</p>
        <p className="text-[13px] text-white/45 leading-relaxed">
          Your payment cleared. The webhook is creating your API key on chain right
          now. Usually takes 5–10 seconds.
        </p>
        <p className="text-[11px] font-mono text-white/25 mt-4">
          txn · {transactionId.slice(0, 8)}…{transactionId.slice(-6)}
        </p>
      </div>
    );
  }

  if (status.kind === "ready") {
    return (
      <div className="rounded-[24px] border border-[#5B4FE8]/[0.25] bg-[#5B4FE8]/[0.06] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5B4FE8] flex items-center justify-center text-xl">
            ✓
          </div>
          <div>
            <p className="text-lg font-bold text-white">You&apos;re live on Glurk Pro.</p>
            <p className="text-[12px] text-white/45">{status.email}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8] mb-2">
            Your API key (shown once)
          </p>
          <code className="block text-[12px] font-mono text-white/85 break-all bg-black/40 px-3 py-2.5 rounded-lg border border-white/[0.06]">
            {status.key}
          </code>
          <button
            onClick={() => copyKey(status.key)}
            className="mt-2 w-full text-[11px] font-mono px-3 py-2 rounded-md border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          >
            {copied ? "✓ Copied" : "Copy to clipboard"}
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
            Your plan
          </p>
          <p className="text-sm text-white/70">
            <span className="capitalize">{status.tier}</span> · {status.quota.toLocaleString()} calls / month
          </p>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
            Use it
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`curl https://glurk.slayerblade.site/api/v1/check?wallet=<wallet> \\
  -H "Authorization: Bearer ${status.key}"`}
          </pre>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[12px]">
          <Link
            href="/dashboard/keys"
            className="font-mono text-[#A79EFF] hover:text-white transition-colors"
          >
            view usage →
          </Link>
          <Link
            href="/docs"
            className="font-mono text-[#7B6FF8] hover:text-white transition-colors"
          >
            full docs →
          </Link>
          <a
            href={`mailto:arnavmaurya.am@gmail.com?subject=Glurk Pro · ${status.email}`}
            className="font-mono text-white/40 hover:text-white transition-colors"
          >
            email founder →
          </a>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Save your key now — this page is the only time it&apos;s shown in full. You can
          always come back to <Link href="/dashboard/keys" className="underline decoration-dotted hover:text-white/70">/dashboard/keys</Link>{" "}
          to check usage and reset date.
        </p>
      </div>
    );
  }

  if (status.kind === "timeout") {
    return (
      <div className="rounded-[24px] border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-8 space-y-3">
        <p className="text-lg font-bold text-yellow-300">Taking longer than expected…</p>
        <p className="text-[13px] text-white/55 leading-relaxed">
          The webhook usually fires within seconds, but Paddle occasionally takes a
          minute. We&apos;ll send you the key by email shortly. If you don&apos;t see
          it, reach out:
        </p>
        <a
          href="mailto:arnavmaurya.am@gmail.com?subject=Glurk Pro · webhook timeout"
          className="inline-block text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
        >
          arnavmaurya.am@gmail.com →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-red-500/[0.18] bg-red-500/[0.04] p-8 space-y-2">
      <p className="text-lg font-bold text-red-300">Something went wrong</p>
      <p className="text-[13px] text-white/55">{status.message}</p>
    </div>
  );
}
