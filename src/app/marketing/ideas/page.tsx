"use client";

import { useState, useEffect, useCallback } from "react";

interface Idea {
  id: string;
  title: string;
  angle: string | null;
  source: string | null;
  persona: string | null;
  priority: number;
  status: string;
  converted_content_id: string | null;
  created_at: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newAngle, setNewAngle] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState("");

  const fetchIdeas = useCallback(async () => {
    const res = await fetch("/api/marketing/ideas");
    if (res.ok) setIdeas(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/marketing/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, angle: newAngle || undefined }),
    });
    setNewTitle("");
    setNewAngle("");
    fetchIdeas();
  };

  const handleConvert = async (ideaId: string) => {
    if (!selectedChannelId) return;
    setConvertingId(ideaId);
    await fetch(`/api/marketing/ideas/${ideaId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: selectedChannelId }),
    });
    setConvertingId(null);
    fetchIdeas();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/marketing/ideas/${id}`, { method: "DELETE" });
    fetchIdeas();
  };

  const handlePriorityUp = async (idea: Idea) => {
    await fetch(`/api/marketing/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: idea.priority - 1 }),
    });
    fetchIdeas();
  };

  const handlePriorityDown = async (idea: Idea) => {
    await fetch(`/api/marketing/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: idea.priority + 1 }),
    });
    fetchIdeas();
  };

  const activeIdeas = ideas.filter((i) => i.status !== "archived" && i.status !== "used");
  const usedIdeas = ideas.filter((i) => i.status === "used");

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Idea Backlog</h1>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New idea title..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <input
          value={newAngle}
          onChange={(e) => setNewAngle(e.target.value)}
          placeholder="Angle (optional)"
          className="w-48 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Idea
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Active Ideas ({activeIdeas.length})</h2>
        {activeIdeas.length === 0 ? (
          <p className="text-sm text-zinc-500">No ideas yet. Add one above.</p>
        ) : (
          activeIdeas
            .sort((a, b) => a.priority - b.priority)
            .map((idea) => (
              <div
                key={idea.id}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 font-mono">
                      #{idea.priority}
                    </span>
                    <p className="font-medium">{idea.title}</p>
                  </div>
                  {idea.angle && (
                    <p className="text-sm text-zinc-400 mt-1">{idea.angle}</p>
                  )}
                  {idea.persona && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Persona: {idea.persona}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {convertingId === idea.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={selectedChannelId}
                        onChange={(e) => setSelectedChannelId(e.target.value)}
                        placeholder="Channel ID"
                        className="w-32 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => handleConvert(idea.id)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePriorityUp(idea)}
                        className="text-zinc-600 hover:text-zinc-400 text-xs"
                        title="Higher priority"
                      >
                        &#8593;
                      </button>
                      <button
                        onClick={() => handlePriorityDown(idea)}
                        className="text-zinc-600 hover:text-zinc-400 text-xs"
                        title="Lower priority"
                      >
                        &#8595;
                      </button>
                      <button
                        onClick={() => setConvertingId(idea.id)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Convert to Content
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {usedIdeas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-400">
            Converted ({usedIdeas.length})
          </h2>
          {usedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/50 opacity-60"
            >
              <p className="text-sm">{idea.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
