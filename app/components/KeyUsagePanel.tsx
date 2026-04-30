"use client";

import { useEffect, useState } from "react";

interface KeyInfo {
  ok: true;
  keyPreview: string;
  emailMasked: string;
  tier: string;
  active: boolean;
  monthlyQuota: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  monthlyPercentUsed: number;
  resetAt: string;
  daysUntilReset: number;
  totalCalls: number;
  lastUsedAt: string | null;
  createdAt: string;
  appName: string | null;
  paddle: { linked: boolean; status: string | null };
}

interface KeyError {
  ok: false;
  error: string;
}

const STORAGE_KEY = "glurk:dash:lastKey";

function formatDate(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tierBadgeClass(tier: string): string {
  switch (tier) {
    case "pro":
      return "bg-[#5B4FE8]/15 border-[#5B4FE8]/30 text-[#A79EFF]";
    case "enterprise":
      return "bg-yellow-500/15 border-yellow-500/30 text-yellow-300";
    default:
      return "bg-white/5 border-white/15 text-white/60";
  }
}

export default function KeyUsagePanel() {
  const [input, setInput] = useState("");
  const [info, setInfo] = useState<KeyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  // Auto-load last-checked key on mount (per-browser convenience).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInput(saved);
      void load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(key: string) {
    const trimmed = key.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/keys/info?key=${encodeURIComponent(trimmed)}`);
      const data: KeyInfo | KeyError = await res.json();
      if (!res.ok || data.ok === false) {
        setError("error" in data ? data.error : `request failed (${res.status})`);
        setInfo(null);
      } else {
        setInfo(data);
        if (remember && typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, trimmed);
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setInfo(null);
    setError(null);
    setInput("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(input);
            }}
            spellCheck={false}
            autoComplete="off"
            placeholder="paste your glk_… key"
            className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-2.5 text-[12px] font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#5B4FE8]/60"
          />
          <button
            onClick={() => void load(input)}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] disabled:opacity-40 transition-colors px-4 py-2.5 text-[12px] font-bold"
          >
            {loading ? "…" : "Load"}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-[11px] text-white/45">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#5B4FE8]"
            />
            Remember this key in this browser
          </label>
          {info && (
            <button
              onClick={clear}
              className="text-[11px] font-mono text-white/30 hover:text-white/70 transition-colors"
            >
              forget key
            </button>
          )}
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Possession of the key is the credential — same as making API calls. Stored
          locally in your browser only if you check the box. This lookup does not
          count against your monthly quota.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/[0.18] bg-red-500/[0.04] p-5 text-[13px] text-red-300/80">
          {error}
        </div>
      )}

      {info && (
        <div className="space-y-5">
          {/* ─── Top row: identity + quota ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                Key
              </p>
              <p className="text-[14px] font-mono text-white/80 break-all mb-3">
                {info.keyPreview}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${tierBadgeClass(
                    info.tier,
                  )}`}
                >
                  {info.tier}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                    info.active
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {info.active ? "active" : "deactivated"}
                </span>
                {info.paddle.linked && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-white/[0.04] border-white/15 text-white/55">
                    paddle · {info.paddle.status ?? "linked"}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                Owner
              </p>
              <p className="text-[14px] font-mono text-white/80 mb-1">
                {info.emailMasked}
              </p>
              {info.appName && (
                <p className="text-[12px] text-white/45">app: {info.appName}</p>
              )}
              <p className="text-[11px] text-white/30 mt-2">
                created {formatDate(info.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                Activity
              </p>
              <p className="text-[14px] text-white/80 mb-1">
                Last call: <span className="font-mono">{formatDate(info.lastUsedAt)}</span>
              </p>
              <p className="text-[14px] text-white/80">
                All-time: <span className="font-mono">{info.totalCalls.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* ─── Quota bar ─── */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-1">
                  This month
                </p>
                <p className="text-3xl font-black tracking-tight">
                  {info.monthlyUsed.toLocaleString()}
                  <span className="text-white/30 font-medium text-xl">
                    {" "}
                    / {info.monthlyQuota.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-1">
                  Resets in
                </p>
                <p className="text-[14px] font-mono text-white/80">
                  {info.daysUntilReset} day{info.daysUntilReset === 1 ? "" : "s"}
                </p>
                <p className="text-[10px] font-mono text-white/30">
                  {new Date(info.resetAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] ${
                  info.monthlyPercentUsed >= 90
                    ? "bg-red-500"
                    : info.monthlyPercentUsed >= 70
                      ? "bg-yellow-500"
                      : "bg-[#5B4FE8]"
                }`}
                style={{ width: `${Math.max(2, info.monthlyPercentUsed)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-white/40">
              <span>{info.monthlyPercentUsed}% used</span>
              <span>{info.monthlyRemaining.toLocaleString()} remaining</span>
            </div>

            {info.monthlyPercentUsed >= 80 && (
              <div className="mt-4 rounded-xl border border-yellow-500/[0.2] bg-yellow-500/[0.05] p-3 text-[12px] text-yellow-300/80">
                {info.tier === "free"
                  ? "Approaching the free-tier ceiling. Upgrade to Pro for 50× more headroom."
                  : "Approaching your monthly quota. Calls past 100% return HTTP 429 until reset."}
                {info.tier === "free" && (
                  <a
                    href="/pricing"
                    className="ml-2 underline decoration-dotted hover:text-yellow-100"
                  >
                    upgrade →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
