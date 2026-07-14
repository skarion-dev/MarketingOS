"use client";

import { useState, useEffect } from "react";

export default function AttributionReportPage() {
  const [report, setReport] = useState<{ campaigns: Record<string, number>; channels: Record<string, number> } | null>(null);

  useEffect(() => {
    fetch("/api/marketing/attribution")
      .then((r) => r.json())
      .then(setReport)
      .catch(console.error);
  }, []);

  if (!report) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Attribution Report</h1>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">By Campaign</h2>
          <div className="space-y-2">
            {Object.entries(report.campaigns).map(([id, count]) => (
              <div key={id} className="flex justify-between border border-zinc-800 rounded p-3 bg-zinc-900">
                <span className="text-sm">{id.slice(0, 8)}...</span>
                <span className="text-sm font-semibold">{count} touches</span>
              </div>
            ))}
            {Object.keys(report.campaigns).length === 0 && <p className="text-zinc-500 text-sm">No data</p>}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">By Channel</h2>
          <div className="space-y-2">
            {Object.entries(report.channels).map(([id, count]) => (
              <div key={id} className="flex justify-between border border-zinc-800 rounded p-3 bg-zinc-900">
                <span className="text-sm">{id.slice(0, 8)}...</span>
                <span className="text-sm font-semibold">{count} touches</span>
              </div>
            ))}
            {Object.keys(report.channels).length === 0 && <p className="text-zinc-500 text-sm">No data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
