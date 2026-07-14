"use client";

import { useState, useEffect } from "react";

const STAGES = ["identified", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];

interface Opp {
  id: string;
  name: string;
  stage: string;
  value_cents: number;
  probability: number;
}

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState<Opp[]>([]);

  useEffect(() => {
    fetch("/api/marketing/opportunities")
      .then((r) => r.json())
      .then((d) => setOpps(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pipeline</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGES.map((stage) => {
          const items = opps.filter((o) => o.stage === stage);
          return (
            <div key={stage} className="border border-zinc-800 rounded-lg bg-zinc-900 p-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">{stage.replace("_", " ")}</h3>
              <div className="space-y-2">
                {items.map((o) => (
                  <div key={o.id} className="border border-zinc-700 rounded p-2 bg-zinc-800 text-sm">
                    <p className="font-medium">{o.name}</p>
                    <p className="text-zinc-500 text-xs">${((o.value_cents ?? 0) / 100).toFixed(0)} — {o.probability}%</p>
                  </div>
                ))}
                {items.length === 0 && <p className="text-zinc-600 text-xs">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
