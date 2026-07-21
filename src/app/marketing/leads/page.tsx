"use client";

import { useState, useEffect, useCallback } from "react";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  linkedin_url: string | null;
  status: string;
  temperature: string;
  source_content_id: string | null;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/marketing/leads");
    if (res.ok) setLeads(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const temperatureColors: Record<string, string> = {
    hot: "bg-red-900 text-red-300",
    warm: "bg-yellow-900 text-yellow-300",
    cold: "bg-blue-900 text-blue-300",
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leads</h1>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Temperature</th>
              <th className="text-left px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                <td className="px-4 py-3">{lead.name ?? "\u2014"}</td>
                <td className="px-4 py-3 text-zinc-400">{lead.email ?? "\u2014"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${temperatureColors[lead.temperature] ?? "bg-zinc-800"}`}>
                    {lead.temperature}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-zinc-500 text-center">
                  No leads yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
