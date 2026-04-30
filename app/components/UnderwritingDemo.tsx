"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";

interface CheckResponse {
  ok?: boolean;
  glurkScore?: number;
  credentialCount?: number;
  issuerCount?: number;
  credentials?: Array<{
    issuer: string;
    slug: string;
    tier: string;
    score: number;
  }>;
  error?: string;
}

const SAMPLES: Array<{ label: string; wallet: string; note: string }> = [
  {
    label: "Staq issuer wallet",
    wallet: "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT",
    note: "an issuer authority — 0 credentials of its own",
  },
  {
    label: "GitHub issuer wallet",
    wallet: "JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k",
    note: "an issuer authority — 0 credentials of its own",
  },
];

const STAQ_ISSUER = "BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT";
const APPROVE_THRESHOLD = 300;

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

interface Verdict {
  approve: boolean;
  reason: string;
  collateralRatio: number;
  hasFinlit: boolean;
}

function decide(profile: CheckResponse): Verdict {
  const score = profile.glurkScore ?? 0;
  const creds = profile.credentials ?? [];
  const hasFinlit = creds.some(
    (c) => c.issuer === STAQ_ISSUER && c.tier !== "bronze",
  );

  if (score === 0 && creds.length === 0) {
    return {
      approve: false,
      reason:
        "No Glurk profile — this is what your existing flow already does. The decision changes the moment a user earns even one credential.",
      collateralRatio: 1.5,
      hasFinlit: false,
    };
  }

  if (score < APPROVE_THRESHOLD) {
    return {
      approve: false,
      reason: `Glurk Score ${score} below threshold ${APPROVE_THRESHOLD}.`,
      collateralRatio: 1.5,
      hasFinlit,
    };
  }

  // Apply the same dynamic-collateral math the SDK exposes.
  const MAX_DISCOUNT = 0.35;
  const THRESHOLD_SCORE = 300;
  const baseRatio = 1.5;
  const discountFactor =
    ((score - THRESHOLD_SCORE) / (1000 - THRESHOLD_SCORE)) * MAX_DISCOUNT;
  const ratio = Math.max(1.05, baseRatio * (1 - discountFactor));

  return {
    approve: true,
    reason: hasFinlit
      ? `Glurk Score ${score} + verified Staq finlit credentials.`
      : `Glurk Score ${score}.`,
    collateralRatio: Number(ratio.toFixed(3)),
    hasFinlit,
  };
}

export default function UnderwritingDemo() {
  const [input, setInput] = useState(SAMPLES[0].wallet);
  const [profile, setProfile] = useState<CheckResponse | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const wallet = input.trim();
    if (!wallet) return;
    if (!isValidPubkey(wallet)) {
      setError("Not a valid Solana wallet address.");
      return;
    }

    setError(null);
    setLoading(true);
    setProfile(null);
    setVerdict(null);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/v1/check?wallet=${encodeURIComponent(wallet)}`);
      const elapsed = Math.round(performance.now() - t0);
      const data: CheckResponse = await res.json();
      setLatency(elapsed);
      if (!res.ok || data.ok === false) {
        setError(data.error ?? `request failed (${res.status})`);
      } else {
        setProfile(data);
        setVerdict(decide(data));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
          Run the underwriting decision live
        </p>
        <p className="text-[13px] text-white/55 leading-relaxed">
          Paste any Solana wallet. We&apos;ll fetch its Glurk profile, apply a sample
          underwriting policy (score ≥ 300 + Glurk-issued finlit credential), and tell
          you whether you&apos;d approve. This is the same call your backend would make.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
          spellCheck={false}
          className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-[12px] font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60"
          placeholder="paste a Solana wallet"
        />
        <button
          onClick={run}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] disabled:opacity-40 transition-colors px-5 py-3 text-[12px] font-bold"
        >
          {loading ? "…" : "Run check"}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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
        <span className="text-[10px] font-mono text-white/25 ml-auto">
          tip: real Gen Z user wallets earn credentials via{" "}
          <a
            href="https://staq.slayerblade.site"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-white/70 transition-colors"
          >
            staq.slayerblade.site
          </a>
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/[0.18] bg-red-500/[0.04] p-3 text-[12px] text-red-300/80 font-mono">
          {error}
        </div>
      )}

      {verdict && profile && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-5 ${
              verdict.approve
                ? "border-[#5B4FE8]/[0.3] bg-[#5B4FE8]/[0.06]"
                : "border-yellow-500/[0.18] bg-yellow-500/[0.04]"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-black ${
                  verdict.approve ? "bg-[#5B4FE8] text-white" : "bg-yellow-500/30 text-yellow-300"
                }`}
              >
                {verdict.approve ? "✓" : "↻"}
              </div>
              <div>
                <p className="text-[15px] font-bold">
                  {verdict.approve ? "APPROVE" : "FALL BACK to manual KYC"}
                </p>
                <p className="text-[11px] text-white/45">{verdict.reason}</p>
              </div>
              {latency !== null && (
                <span className="ml-auto text-[10px] font-mono text-white/30">
                  decision in {latency}ms
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Glurk Score
                </p>
                <p className="text-lg font-black text-white">
                  {profile.glurkScore ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Credentials
                </p>
                <p className="text-lg font-black text-white">
                  {profile.credentialCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Issuers
                </p>
                <p className="text-lg font-black text-white">
                  {profile.issuerCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Collateral
                </p>
                <p className="text-lg font-black text-white">
                  {Math.round(verdict.collateralRatio * 100)}%
                </p>
              </div>
            </div>
            {verdict.approve && (
              <p className="text-[11px] text-white/45 mt-3">
                Standard pool requires 150% collateral. Glurk Score{" "}
                {profile.glurkScore ?? 0} brings it down to{" "}
                {Math.round(verdict.collateralRatio * 100)}% via the
                {` `}
                <code className="font-mono text-white/65">calculateDynamicCollateral</code> helper.
              </p>
            )}
          </div>

          {profile.credentials && profile.credentials.length > 0 && (
            <details className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <summary className="px-4 py-2.5 text-[12px] text-white/55 cursor-pointer">
                Inspect raw credentials ({profile.credentials.length})
              </summary>
              <div className="border-t border-white/[0.06] p-3 space-y-1">
                {profile.credentials.map((c) => (
                  <div
                    key={`${c.issuer}-${c.slug}`}
                    className="flex items-center justify-between gap-3 text-[11px] font-mono"
                  >
                    <span className="text-white/65">{c.slug}</span>
                    <span className="text-white/40">
                      {c.tier} · {c.score}/100
                    </span>
                    <span className="text-white/25 truncate">
                      {c.issuer.slice(0, 4)}…{c.issuer.slice(-4)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
