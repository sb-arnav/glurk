"use client";

import { useEffect, useState } from "react";

export default function StatsBar() {
  const [stats, setStats] = useState<{ credentials: number; consents: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.credentials === "number") setStats(d);
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#7B6FF8] shrink-0" />
        <span className="text-[11px] font-mono text-white/35">
          <span className="text-[#A79EFF] font-bold">{stats.credentials}</span> credentials on-chain
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
        <span className="text-[11px] font-mono text-white/35">
          <span className="text-blue-300 font-bold">{stats.consents}</span> consent{stats.consents !== 1 ? "s" : ""} granted
        </span>
      </div>
    </div>
  );
}
