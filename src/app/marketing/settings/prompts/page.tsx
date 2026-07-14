"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  kind: string;
  subtype: string | null;
  user_prompt: string;
  status: string;
  version: number;
  created_at: string;
}

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("content");
  const [userPrompt, setUserPrompt] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/prompt-templates");
      if (res.ok) setTemplates(await res.json());
    } catch {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !userPrompt) return;
    await fetch("/api/marketing/prompt-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind, user_prompt: userPrompt }),
    });
    setName("");
    setUserPrompt("");
    fetchTemplates();
  }

  async function handleApprove(id: string) {
    await fetch(`/api/marketing/prompt-templates/${id}/approve`, { method: "POST" });
    fetchTemplates();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/marketing/prompt-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  if (loading) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Prompt Templates</h1>

      <form onSubmit={handleCreate} className="flex gap-3 mb-6 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Template name" className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm" />
        <select value={kind} onChange={(e) => setKind(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm">
          <option value="content">Content</option>
          <option value="research">Research</option>
          <option value="image">Image</option>
        </select>
        <input value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="User prompt template..." className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <button type="submit" disabled={!name || !userPrompt}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">Create</button>
      </form>

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{t.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{t.kind}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  t.status === "approved" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"
                }`}>{t.status}</span>
                <span className="text-xs text-zinc-500">v{t.version}</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1 truncate">{t.user_prompt.slice(0, 120)}...</p>
            </div>
            <div className="flex gap-2 ml-4">
              {t.status === "draft" && (
                <button onClick={() => handleApprove(t.id)}
                  className="text-xs text-green-400 hover:text-green-300">Approve</button>
              )}
              <button onClick={() => handleDelete(t.id)}
                className="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-zinc-500 text-sm">No templates yet.</p>}
      </div>
    </div>
  );
}
