"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Prospect {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  type: string;
  source: string | null;
  stage: string;
  status: string;
  created_at: string;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  useEffect(() => {
    fetchProspects();
  }, []);

  function fetchProspects() {
    setLoading(true);
    fetch("/api/marketing/prospects")
      .then((r) => r.json())
      .then((d) => setProspects(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult("");

    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) {
      setImportResult("CSV must have a header row + at least one data row");
      setImporting(false);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    });

    try {
      const res = await fetch("/api/marketing/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const result = await res.json();
      setImportResult(`Created: ${result.created}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
      fetchProspects();
    } catch (err) {
      setImportResult(String(err));
    }

    setImporting(false);
    e.target.value = "";
  }

  const filtered = prospects.filter((p) => {
    if (filterType && p.type !== filterType) return false;
    if (filterSource && p.source !== filterSource) return false;
    return true;
  });

  if (loading) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prospects</h1>
        <div className="flex gap-2">
          <label className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm cursor-pointer hover:bg-zinc-800">
            {importing ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          {importResult && (
            <span className="text-xs text-zinc-400 self-center">{importResult}</span>
          )}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="email">Email</option>
            <option value="manual">Manual</option>
            <option value="import">Import</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">No prospects found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/marketing/prospects/${p.id}`}
              className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 hover:border-zinc-600 transition-colors"
            >
              <p className="font-medium truncate">
                {p.first_name || p.last_name
                  ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                  : p.email || p.company || "Unnamed"}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {p.company && `${p.company} · `}{p.type}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {p.stage}
                </span>
                {p.source && (
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {p.source}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
