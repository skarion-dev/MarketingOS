"use client";

import { useState, useEffect } from "react";

export default function AiUsagePage() {
  const [data, setData] = useState<{ totalCents: number; runs: unknown[] } | null>(null);

  useEffect(() => {
    fetch("/api/marketing/reports/ai-usage")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Usage & Spend</h1>
      {data && (
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 mb-6">
          <p className="text-3xl font-bold">${((data.totalCents ?? 0) / 100).toFixed(2)}</p>
          <p className="text-sm text-zinc-400">Total AI spend</p>
        </div>
      )}
    </div>
  );
}
