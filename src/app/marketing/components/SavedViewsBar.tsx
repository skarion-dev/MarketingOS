"use client";

import { useState, useEffect } from "react";

interface SavedView {
  id: string;
  name: string;
  entity: string;
  filters: Record<string, unknown>;
  is_default: boolean;
}

export default function SavedViewsBar({ entity, onApply }: {
  entity: string;
  onApply: (filters: Record<string, unknown>) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedViews();
  }, [entity]);

  async function fetchSavedViews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing/saved-views?entity=${entity}`);
      if (res.ok) setViews(await res.json());
    } catch {}
    setLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) return;
    await fetch("/api/marketing/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entity, filters: {} }),
    });
    setName("");
    fetchSavedViews();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/marketing/saved-views/${id}`, { method: "DELETE" });
    fetchSavedViews();
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-3 mb-4 text-sm">
      <span className="text-zinc-400">Saved Views:</span>
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onApply(v.filters)}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          {v.name}
          <span
            onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
            className="ml-1 text-zinc-500 hover:text-red-400"
          >x</span>
        </button>
      ))}
      <div className="flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save current..."
          className="border border-zinc-700 bg-zinc-800 rounded px-2 py-0.5 text-xs w-32"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
