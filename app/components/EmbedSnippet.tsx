"use client";

import { useState } from "react";

export default function EmbedSnippet({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://glurk.slayerblade.site";
  const snippet = `<iframe src="${origin}/embed/${wallet}" width="360" height="180" frameborder="0" style="border-radius:16px"></iframe>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this iframe snippet:", snippet);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-[10px] font-mono tracking-widest uppercase text-white/25">
          Embed this badge
        </p>
        <button
          onClick={copy}
          className="text-[11px] font-mono px-2 py-1 rounded-md border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 text-[#A79EFF] hover:bg-[#5B4FE8]/20 transition-colors"
        >
          {copied ? "✓ Copied" : "Copy snippet"}
        </button>
      </div>
      <p className="text-sm text-white/45 leading-relaxed mb-4">
        Drop this iframe into any site to verify this wallet&apos;s Glurk credentials. Updates live
        from chain — no JS dependency, no API key.
      </p>
      <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[12px] text-white/75 leading-relaxed font-mono">
        {snippet}
      </pre>
    </section>
  );
}
