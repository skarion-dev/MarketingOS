"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SavedView {
  id: string;
  name: string;
  entity: string;
  config: Record<string, unknown>;
  view_type: "grid" | "kanban" | "calendar";
  is_default: boolean;
}

export default function SavedViewsBar({
  entity,
  viewType,
  onViewChange,
  onApplyFilters,
}: {
  entity: string;
  viewType: string;
  onViewChange: (type: string, viewId?: string) => void;
  onApplyFilters: (config: Record<string, unknown>) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");

  const loadViews = useCallback(async () => {
    const res = await fetch(`/api/marketing/views?entity=${entity}`);
    if (res.ok) setViews(await res.json());
  }, [entity]);

  useState(() => {
    loadViews();
  });

  const handleSave = async () => {
    if (!saveName.trim()) return;
    await fetch("/api/marketing/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity,
        name: saveName,
        config: {},
        view_type: viewType,
      }),
    });
    setSaveName("");
    setShowSave(false);
    loadViews();
  };

  const handleApply = (view: SavedView) => {
    onViewChange(view.view_type, view.id);
    onApplyFilters(view.config);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/marketing/views/${id}`, { method: "DELETE" });
    loadViews();
  };

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="flex gap-1 bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
        {["grid", "kanban", "calendar"].map((type) => (
          <button
            key={type}
            onClick={() => onViewChange(type)}
            className={`px-3 py-1 text-xs rounded-md ${
              viewType === type
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-zinc-800" />

      {views.map((view) => (
        <div key={view.id} className="flex items-center gap-1">
          <button
            onClick={() => handleApply(view)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            {view.name}
          </button>
          <button
            onClick={() => handleDelete(view.id)}
            className="text-zinc-600 hover:text-red-400 text-xs"
          >
            x
          </button>
        </div>
      ))}

      {showSave ? (
        <div className="flex items-center gap-1">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="View name"
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs w-32"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            className="text-xs text-green-400 hover:text-green-300"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSave(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          + Save View
        </button>
      )}
    </div>
  );
}
