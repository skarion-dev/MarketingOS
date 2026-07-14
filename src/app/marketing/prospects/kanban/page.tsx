"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STAGES = ["new", "contacted", "qualified", "nurturing", "unqualified"];

interface Prospect {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  stage: string;
}

export default function ProspectsKanbanPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    fetch("/api/marketing/prospects")
      .then((r) => r.json())
      .then((d) => setProspects(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Prospects Kanban</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const items = prospects.filter((p) => p.stage === stage);
          return (
            <div key={stage} className="border border-zinc-800 rounded-lg bg-zinc-900 p-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-3">{stage}</h3>
              <div className="space-y-2">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/marketing/prospects/${p.id}`}
                    className="block border border-zinc-700 rounded p-2 bg-zinc-800 hover:border-zinc-500 text-sm"
                  >
                    <p className="font-medium truncate">
                      {p.first_name || p.last_name
                        ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                        : p.email || "Unnamed"}
                    </p>
                    {p.company && <p className="text-zinc-500 text-xs">{p.company}</p>}
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="text-zinc-600 text-xs">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
