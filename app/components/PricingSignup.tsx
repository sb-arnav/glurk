"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; key: string }
  | { kind: "redirecting" }
  | { kind: "error"; message: string };

export default function PricingSignup({ tier }: { tier: "free" | "pro" }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [appName, setAppName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus({ kind: "submitting" });
    try {
      if (tier === "pro") {
        const res = await fetch("/api/paddle/checkout-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            tier: "pro",
            appName: appName.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutUrl) {
          throw new Error(data.error || "Failed to create checkout");
        }
        setStatus({ kind: "redirecting" });
        window.location.href = data.checkoutUrl;
        return;
      }

      const res = await fetch("/api/keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tier, appName: appName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setStatus({ kind: "success", key: data.key });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy your API key:", key);
    }
  }

  if (status.kind === "success") {
    return (
      <div className="rounded-xl border border-[#5B4FE8]/30 bg-[#5B4FE8]/10 p-3 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#A79EFF]">
          ✓ Your key (shown once)
        </p>
        <code className="block text-[11px] font-mono text-white/85 break-all bg-black/40 px-2 py-1.5 rounded">
          {status.key}
        </code>
        <button
          onClick={() => copyKey(status.key)}
          className="w-full text-[11px] font-mono px-3 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-colors bg-[#5B4FE8] hover:bg-[#6B5FF8] text-white"
      >
        {tier === "pro" ? "Subscribe — $49/mo" : "Get free API key"} →
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={status.kind === "submitting"}
        className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
      />
      <input
        type="text"
        value={appName}
        onChange={(e) => setAppName(e.target.value)}
        placeholder="App name (optional)"
        disabled={status.kind === "submitting"}
        className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status.kind === "submitting" || status.kind === "redirecting" || !email.trim()}
        className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-[12px] font-bold transition-colors bg-[#5B4FE8] hover:bg-[#6B5FF8] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status.kind === "redirecting"
          ? "Opening checkout…"
          : status.kind === "submitting"
            ? tier === "pro"
              ? "Preparing checkout…"
              : "Creating…"
            : tier === "pro"
              ? "Continue to Paddle →"
              : "Create key"}
      </button>
      {status.kind === "error" && (
        <p className="text-[11px] text-red-300/80 font-mono">{status.message}</p>
      )}
    </form>
  );
}
