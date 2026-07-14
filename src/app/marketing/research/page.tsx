"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ResearchRun {
  id: string;
  subject: string;
  prompt_type: string;
  grounded: boolean;
  created_at: string;
}

export default function ResearchPage() {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [subject, setSubject] = useState("");
  const [promptType, setPromptType] = useState("company");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchRuns() {
    try {
      const res = await fetch("/api/marketing/research");
      if (res.ok) setRuns(await res.json());
    } catch {}
  }

  useEffect(() => { fetchRuns(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/marketing/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, promptType }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setResult(data.content);
      fetchRuns();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Research</h1>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6 flex-wrap">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Company or contact name"
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select value={promptType} onChange={(e) => setPromptType(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm">
          <option value="company">Company</option>
          <option value="contact">Contact</option>
          <option value="competitor">Competitor</option>
        </select>
        <button type="submit" disabled={loading || !subject}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Researching..." : "Research"}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {result && (
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 mb-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">Result</h3>
          <p className="text-sm whitespace-pre-wrap">{result}</p>
        </div>
      )}
      <h2 className="text-lg font-semibold mb-3">History</h2>
      <div className="space-y-2">
        {runs.map((r) => (
          <Link key={r.id} href={`/marketing/research/${r.id}`}
            className="block border border-zinc-800 rounded-lg p-3 bg-zinc-900 hover:border-zinc-600">
            <p className="text-sm font-medium">{r.subject}</p>
            <p className="text-xs text-zinc-500">{r.prompt_type} · {new Date(r.created_at).toLocaleString()}</p>
          </Link>
        ))}
        {runs.length === 0 && <p className="text-zinc-500 text-sm">No research runs yet.</p>}
      </div>
    </div>
  );
}
