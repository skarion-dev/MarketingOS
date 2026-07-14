"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Campaign { id: string; name: string; }

const KINDS = ["linkedin_post", "cold_email", "comment_reply", "dm"];

export default function NewContentPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [kind, setKind] = useState("linkedin_post");
  const [tone, setTone] = useState("professional");
  const [prospectId, setProspectId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/marketing/campaigns")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) { setCampaigns(d); if (d.length) setCampaignId(d[0].id); } })
      .catch(console.error);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/marketing/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, kind, tone, prospectId: prospectId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      router.push(`/marketing/content/${data.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Generate Content</h1>
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Campaign</label>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm">
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Content Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm">
            {KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm">
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="persuasive">Persuasive</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Prospect ID (optional)</label>
          <input value={prospectId} onChange={(e) => setProspectId(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={generating || !campaignId}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          {generating ? "Generating..." : "Generate"}
        </button>
      </form>
    </div>
  );
}
