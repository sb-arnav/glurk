"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const JOBS = [
  {
    id: "fin-analyst",
    title: "Junior Financial Analyst",
    company: "Zerodha",
    location: "Bangalore",
    salary: "₹8-12L",
    requiredSlugs: ["credit-score", "stocks", "sell-rules"],
    requiredMinScore: 75,
    tags: ["Finance", "Entry Level"],
  },
  {
    id: "fintech-pm",
    title: "Product Manager — Payments",
    company: "Razorpay",
    location: "Bangalore",
    salary: "₹18-25L",
    requiredSlugs: ["upi", "credit-score"],
    requiredMinScore: 80,
    tags: ["Product", "Fintech"],
  },
  {
    id: "wealth-advisor",
    title: "Wealth Advisor Trainee",
    company: "Groww",
    location: "Remote",
    salary: "₹5-8L",
    requiredSlugs: ["stocks", "sell-rules"],
    requiredMinScore: 70,
    tags: ["Finance", "Remote"],
  },
];

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

function JobsContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    score: number;
    wallet: string;
    credentials: { slug: string; name: string; tier: string; score: number; issuer: string }[];
  } | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    const approved = searchParams.get("approved");
    if (approved === "true") {
      setConnected(true);
      setUserData({
        name: searchParams.get("name") || "User",
        score: Number(searchParams.get("score")) || 0,
        wallet: searchParams.get("wallet") || "",
        credentials: JSON.parse(searchParams.get("credentials") || "[]"),
      });
    }
  }, [searchParams]);

  const handleSignIn = () => {
    const params = new URLSearchParams({
      app: "StaqJobs",
      icon: "💼",
      fields: "credit-score,stocks,upi,sell-rules",
      contribute_slug: "job-history",
      contribute_name: "Employment Verification",
      contribute_tier: "silver",
      callback: "/demo/jobs",
    });
    window.location.href = `/consent?${params.toString()}`;
  };

  const handleApply = (jobId: string) => {
    setApplying(jobId);
    setTimeout(() => {
      setApplying(null);
      setApplied(jobId);
    }, 1500);
  };

  const userSlugs = new Set((userData?.credentials || []).map((c) => c.slug));

  const jobEligibility = JOBS.map((job) => {
    const missingCreds = job.requiredSlugs.filter((s) => !userSlugs.has(s));
    const avgScore = userData
      ? (userData.credentials
          .filter((c) => job.requiredSlugs.includes(c.slug))
          .reduce((sum, c) => sum + c.score, 0) /
          job.requiredSlugs.length) || 0
      : 0;
    return {
      ...job,
      eligible: missingCreds.length === 0 && avgScore >= job.requiredMinScore,
      missingCreds,
      avgScore: Math.round(avgScore),
    };
  });

  return (
    <div className="min-h-screen">
      {/* App header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💼</span>
            <span className="font-bold text-lg">
              Staq<span className="text-blue-400">Jobs</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase px-2 py-1 border border-white/[0.06] rounded-md">
            Demo App
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {!connected ? (
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Get hired with{" "}
              <span className="text-blue-400">verified skills.</span>
            </h1>
            <p className="text-white/35 text-[15px] leading-relaxed mb-10">
              Skip the take-home test. Your verified financial knowledge unlocks
              direct applications at top fintech companies.
            </p>

            <button
              onClick={handleSignIn}
              className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-black">
                G
              </div>
              <span className="font-semibold text-[15px]">
                Sign in with Glurk
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-center text-[11px] text-white/15 mt-4">
              Glurk reads your skills and contributes employment data back. You
              approve everything.
            </p>

            {/* Jobs preview */}
            <div className="mt-12 space-y-3">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-4">
                Open roles
              </p>
              {JOBS.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{job.title}</p>
                      <p className="text-xs text-white/30">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-white/40">
                      {job.salary}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-center text-[11px] text-white/15 pt-2">
                Connect Glurk to see which roles you qualify for
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* User header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                {userData?.name[0]}
              </div>
              <div>
                <p className="font-bold">{userData?.name}</p>
                <p className="text-[11px] font-mono text-white/25">
                  {userData?.wallet.slice(0, 8)}...{userData?.wallet.slice(-4)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-black text-emerald-400">
                  {userData?.score}
                </p>
                <p className="text-[10px] text-white/25 font-mono">
                  GLURK SCORE
                </p>
              </div>
            </div>

            {/* Verified skills */}
            <div className="flex flex-wrap gap-1.5 mb-6 mt-4">
              {userData?.credentials.map((c) => (
                <span
                  key={c.slug}
                  className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50"
                  style={{ borderColor: TIER_COLORS[c.tier] + "20" }}
                >
                  <span style={{ color: TIER_COLORS[c.tier] }}>✓</span>{" "}
                  {c.name}
                </span>
              ))}
            </div>

            {/* Jobs */}
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
              Matched roles
            </p>
            <div className="space-y-3">
              {jobEligibility.map((job) => (
                <div
                  key={job.id}
                  className={`rounded-xl border p-4 transition-all ${
                    job.eligible
                      ? "border-emerald-500/[0.15] bg-emerald-500/[0.02]"
                      : "border-white/[0.06] bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {job.eligible && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        )}
                        <p className="font-semibold text-sm">{job.title}</p>
                      </div>
                      <p className="text-xs text-white/30 mb-2">
                        {job.company} · {job.location} · {job.salary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {job.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/30"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {job.eligible ? (
                        applied === job.id ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                            Applied!
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={applying === job.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-60"
                          >
                            {applying === job.id ? "Applying..." : "Apply"}
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-white/25 font-mono">
                          {job.missingCreds.length} missing
                        </span>
                      )}
                    </div>
                  </div>

                  {job.eligible && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-white/25">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-400/60"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                      Verified via Glurk · avg skill score {job.avgScore}/100
                    </div>
                  )}

                  {!job.eligible && job.missingCreds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04]">
                      <p className="text-[11px] text-white/25">
                        Need:{" "}
                        {job.missingCreds.map((s) => (
                          <span
                            key={s}
                            className="font-mono text-white/35"
                          >
                            {s}{" "}
                          </span>
                        ))}
                        credential{job.missingCreds.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Data exchange proof */}
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-2">
                Data exchange
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                  <span className="text-emerald-400">←</span>
                  <span className="text-white/40">
                    <span className="text-white/60 font-semibold">Read:</span>{" "}
                    {userData?.credentials.length} skills + Glurk Score
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-blue-500/[0.03] border border-blue-500/[0.08] text-xs">
                  <span className="text-blue-400">→</span>
                  <span className="text-white/40">
                    <span className="text-blue-400 font-semibold">
                      Contributed:
                    </span>{" "}
                    Employment Verification (Silver tier)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white/20">Loading...</p>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
