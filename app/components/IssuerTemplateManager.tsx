"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";

const TIERS = ["platinum", "gold", "silver", "bronze"] as const;
type Tier = (typeof TIERS)[number];

const TIER_COLORS: Record<Tier, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

export interface Template {
  slug: string;
  name: string;
  description: string | null;
  default_tier: Tier;
  default_score: number;
  display_order: number;
  active: boolean;
  created_at: string;
}

type EditState =
  | { kind: "view" }
  | { kind: "creating" }
  | { kind: "editing"; original: Template };

// Phantom's signMessage isn't in the shared Window declaration the other
// components use. Cast inline rather than redeclaring (which causes a
// declaration-merge conflict at build time).
type PhantomSignMessage = (
  message: Uint8Array,
  encoding?: string,
) => Promise<{ signature: Uint8Array }>;

interface Props {
  authority: string;
  /**
   * Initial templates rendered server-side so the public catalog view is
   * always populated even before this component hydrates.
   */
  initialTemplates: Template[];
}

export default function IssuerTemplateManager({ authority, initialTemplates }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [connectedWallet, setConnectedWallet] = useState<PublicKey | null>(null);
  const [edit, setEdit] = useState<EditState>({ kind: "view" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<Tier>("gold");
  const [score, setScore] = useState(80);

  const isOwner = connectedWallet?.toBase58() === authority;

  useEffect(() => {
    let cancelled = false;
    async function reconnect() {
      const sol = window.solana;
      if (!sol?.isPhantom) return;
      try {
        const resp = await sol.connect({ onlyIfTrusted: true });
        if (!cancelled) setConnectedWallet(resp.publicKey);
      } catch {
        // not yet trusted
      }
    }
    reconnect();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/issuer/templates?authority=${authority}`);
      const data = await res.json();
      if (Array.isArray(data.templates)) setTemplates(data.templates);
    } catch {
      // silent — stale view is fine for v1
    }
  }, [authority]);

  async function connect() {
    const sol = window.solana;
    if (!sol?.isPhantom) {
      setError("Phantom not detected. Install at phantom.app/download.");
      return;
    }
    try {
      const resp = await sol.connect();
      setConnectedWallet(resp.publicKey);
    } catch {
      // user rejected
    }
  }

  function startCreate() {
    setSlug("");
    setName("");
    setDescription("");
    setTier("gold");
    setScore(80);
    setError(null);
    setEdit({ kind: "creating" });
  }

  function startEdit(t: Template) {
    setSlug(t.slug);
    setName(t.name);
    setDescription(t.description ?? "");
    setTier(t.default_tier);
    setScore(t.default_score);
    setError(null);
    setEdit({ kind: "editing", original: t });
  }

  async function signAuthMessage(): Promise<{ message: string; signature: string } | null> {
    const sol = window.solana as (typeof window.solana & { signMessage?: PhantomSignMessage }) | undefined;
    if (!sol?.isPhantom || !sol.signMessage) {
      setError("Phantom signMessage not available");
      return null;
    }
    if (!connectedWallet) {
      setError("connect Phantom first");
      return null;
    }
    const message = `glurk:template-write:${connectedWallet.toBase58()}:${Math.floor(Date.now() / 1000)}`;
    try {
      const resp = await sol.signMessage(new TextEncoder().encode(message), "utf8");
      const sigBytes = resp.signature instanceof Uint8Array ? resp.signature : new Uint8Array(resp.signature);
      const signature = Buffer.from(sigBytes).toString("base64");
      return { message, signature };
    } catch {
      return null;
    }
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const auth = await signAuthMessage();
      if (!auth) {
        setBusy(false);
        return;
      }
      const res = await fetch("/api/issuer/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          defaultTier: tier,
          defaultScore: score,
          message: auth.message,
          signature: auth.signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "save failed");
      await refresh();
      setEdit({ kind: "view" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: Template) {
    if (!confirm(`Remove "${t.name}" from your catalog?`)) return;
    setBusy(true);
    setError(null);
    try {
      const auth = await signAuthMessage();
      if (!auth) {
        setBusy(false);
        return;
      }
      const res = await fetch("/api/issuer/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: t.slug,
          message: auth.message,
          signature: auth.signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "delete failed");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
            Credential catalog
          </p>
          <p className="text-sm text-white/55 mt-1">
            {templates.length === 0
              ? "No credentials defined yet."
              : `${templates.length} credential type${templates.length === 1 ? "" : "s"} this issuer offers.`}
          </p>
        </div>
        {isOwner && edit.kind === "view" && (
          <button
            onClick={startCreate}
            className="text-[12px] font-mono px-3 py-1.5 rounded-md bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-white font-bold"
          >
            + add credential
          </button>
        )}
      </div>

      {!isOwner && !connectedWallet && (
        <div className="mb-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[12px] text-white/45">
            Are you the owner of this issuer? Connect Phantom to manage the catalog.
          </p>
          <button
            onClick={connect}
            className="text-[11px] font-mono px-3 py-1 rounded-md border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          >
            Connect
          </button>
        </div>
      )}

      {!isOwner && connectedWallet && (
        <div className="mb-4 rounded-xl border border-yellow-500/[0.18] bg-yellow-500/[0.04] p-3">
          <p className="text-[12px] text-yellow-300/80">
            Connected wallet doesn&apos;t match this issuer&apos;s authority. Switch to{" "}
            <code className="font-mono text-yellow-300/95">
              {authority.slice(0, 6)}…{authority.slice(-6)}
            </code>{" "}
            in Phantom to manage the catalog.
          </p>
        </div>
      )}

      {(edit.kind === "creating" || edit.kind === "editing") && (
        <div className="mb-5 rounded-2xl border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.05] p-5 space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70">
            {edit.kind === "creating" ? "New credential" : `Edit ${edit.original.slug}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                disabled={edit.kind === "editing" || busy}
                placeholder="credit-score"
                maxLength={64}
                className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[13px] font-mono text-white focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                placeholder="Credit Score Basics"
                maxLength={96}
                className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
                placeholder="What earning this credential means"
                maxLength={280}
                className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Default tier
              </label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    disabled={busy}
                    className="rounded-lg border px-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    style={
                      tier === t
                        ? { borderColor: TIER_COLORS[t], color: TIER_COLORS[t], background: "rgba(255,255,255,0.05)" }
                        : { color: TIER_COLORS[t], borderColor: "rgba(255,255,255,0.08)" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Default score (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) =>
                  setScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                }
                disabled={busy}
                className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-[13px] font-mono text-white focus:outline-none focus:border-[#5B4FE8]/60 disabled:opacity-50"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-red-300/80 font-mono">{error}</p>}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={save}
              disabled={busy || !slug || !name}
              className="px-4 py-2 rounded-xl bg-[#5B4FE8] hover:bg-[#6B5FF8] transition-colors text-[12px] font-bold disabled:opacity-50"
            >
              {busy ? "Signing & saving…" : "Sign with Phantom & save"}
            </button>
            <button
              onClick={() => setEdit({ kind: "view" })}
              disabled={busy}
              className="text-[11px] font-mono text-white/40 hover:text-white transition-colors px-2"
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-[13px] text-white/45">
            No catalog yet. {isOwner ? "Click + to add your first credential type." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.slug}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: TIER_COLORS[t.default_tier] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate">{t.name}</p>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
                      style={{
                        color: TIER_COLORS[t.default_tier],
                        borderColor: TIER_COLORS[t.default_tier],
                      }}
                    >
                      {t.default_tier} · {t.default_score}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-white/30 truncate">{t.slug}</p>
                  {t.description && (
                    <p className="text-[12px] text-white/45 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-[11px] font-mono text-white/40 hover:text-white transition-colors px-2"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="text-[11px] font-mono text-red-300/60 hover:text-red-300 transition-colors px-2"
                  >
                    remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
