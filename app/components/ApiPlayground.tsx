"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";

const SAMPLES: Array<{ label: string; wallet: string }> = [
  // Known issuer wallets — guaranteed to have credentials on devnet.
  { label: "Staq issuer", wallet: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT" },
  { label: "GitHub issuer", wallet: "JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k" },
];

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ApiPlayground() {
  const [input, setInput] = useState(SAMPLES[0].wallet);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  async function call() {
    const trimmed = input.trim();
    if (!trimmed) return;

    let url: string;
    if (isValidPubkey(trimmed)) {
      url = `/api/v1/check?wallet=${encodeURIComponent(trimmed)}`;
    } else if (looksLikeEmail(trimmed)) {
      url = `/api/v1/check?email=${encodeURIComponent(trimmed)}`;
    } else {
      setResponse(JSON.stringify({ error: "Enter a Solana wallet or email" }, null, 2));
      setStatus(null);
      setLatency(null);
      return;
    }

    setLoading(true);
    setResponse(null);
    setStatus(null);
    setLatency(null);

    const t0 = performance.now();
    try {
      const res = await fetch(url);
      const elapsed = Math.round(performance.now() - t0);
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
      setStatus(res.status);
      setLatency(elapsed);
    } catch (e) {
      setResponse(JSON.stringify({ error: (e as Error).message }, null, 2));
      setStatus(null);
      setLatency(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
          Try it · GET /api/v1/check
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") call();
            }}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-2.5 text-[12px] font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60"
            placeholder="paste a Solana wallet or email"
          />
          <button
            onClick={call}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] disabled:opacity-40 transition-colors px-4 py-2.5 text-[12px] font-bold"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] font-mono text-white/30">samples:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.wallet}
              onClick={() => setInput(s.wallet)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/80 hover:border-white/[0.15] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(response || loading) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">
              Response
            </p>
            <div className="flex items-center gap-2">
              {status !== null && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    status >= 200 && status < 300
                      ? "bg-[#5B4FE8]/10 border border-[#5B4FE8]/20 text-[#A79EFF]"
                      : "bg-red-500/10 border border-red-500/20 text-red-300"
                  }`}
                >
                  {status}
                </span>
              )}
              {latency !== null && (
                <span className="text-[10px] font-mono text-white/35">{latency}ms</span>
              )}
            </div>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono max-h-96">
            {loading ? "loading…" : response}
          </pre>
        </div>
      )}
    </div>
  );
}
