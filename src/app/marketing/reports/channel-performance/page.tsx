"use client";

import { useState, useEffect } from "react";

export default function ChannelPerformancePage() {
  const [perf, setPerf] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketing/reports/channel-performance")
      .then((r) => r.json())
      .then(setPerf)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-400">Loading...</p>;

  const entries = Object.entries(perf);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Channel Performance</h1>
      {entries.length === 0 ? (
        <p className="text-zinc-500 text-sm">No data yet — touchpoints will appear as content is sent.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([id, count]) => (
            <div key={id} className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 w-24 truncate">{id.slice(0, 8)}...</span>
              <div className="flex-1 bg-zinc-800 rounded h-6 overflow-hidden">
                <div
                  className="bg-blue-600 h-6 rounded transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="text-sm text-zinc-400 w-10 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
