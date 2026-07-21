"use client";

import { useState, useEffect, useCallback } from "react";

export default function ReportsPage() {
  const [channelPerf, setChannelPerf] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cp, au] = await Promise.all([
        fetch("/api/marketing/reports/channel-performance").then((r) => r.json()),
        fetch("/api/marketing/reports/ai-usage").then((r) => r.json()),
      ]);
      setChannelPerf(cp);
      setAiUsage(au);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  const baselines = {
    socialToCall: { actual: channelPerf?.socialPosts ?? 0, callsFromSocial: channelPerf?.callsFromSocial ?? 0, baseline: 5.0 / 67.0 },
    emailToCall: { actual: channelPerf?.emailsSent ?? 0, callsFromEmail: channelPerf?.callsFromEmail ?? 0, baseline: 17.0 / 590.0 },
    dmToCall: { actual: channelPerf?.dmsSent ?? 0, callsFromDMs: channelPerf?.callsFromDMs ?? 0, baseline: 4.0 / 184.0 },
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
          <p className="text-sm text-zinc-400">Total Content</p>
          <p className="text-2xl font-bold">{channelPerf?.totalContent ?? 0}</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
          <p className="text-sm text-zinc-400">Published</p>
          <p className="text-2xl font-bold text-green-400">{channelPerf?.published ?? 0}</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
          <p className="text-sm text-zinc-400">Leads</p>
          <p className="text-2xl font-bold">{channelPerf?.leads ?? 0}</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
          <p className="text-sm text-zinc-400">AI Spend</p>
          <p className="text-2xl font-bold text-yellow-400">
            ${((aiUsage?.totalCostCents ?? 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900 space-y-4">
        <h2 className="text-lg font-medium">Channel Performance vs Baselines</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Social posts → calls</span>
            <span className="text-zinc-400">
              {baselines.socialToCall.actual} → {baselines.socialToCall.callsFromSocial}
              {" vs "}
              <span className="text-zinc-500">baseline 5/67</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Emails → replies → calls</span>
            <span className="text-zinc-400">
              {baselines.emailToCall.actual} → {baselines.emailToCall.callsFromEmail}
              {" vs "}
              <span className="text-zinc-500">baseline 17/590</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>DMs → replies → calls</span>
            <span className="text-zinc-400">
              {baselines.dmToCall.actual} → {baselines.dmToCall.callsFromDMs}
              {" vs "}
              <span className="text-zinc-500">baseline 4/184</span>
            </span>
          </div>
        </div>
      </div>

      {aiUsage && (
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
          <h2 className="text-lg font-medium mb-4">AI Usage</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total calls</span>
              <span className="text-zinc-400">{aiUsage.totalCalls ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total tokens</span>
              <span className="text-zinc-400">{(aiUsage.totalTokens ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total cost</span>
              <span className="text-yellow-400">
                ${((aiUsage.totalCostCents ?? 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
