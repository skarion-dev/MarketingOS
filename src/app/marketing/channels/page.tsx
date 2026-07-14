"use client";

import { useState, useEffect } from "react";

interface Channel {
  id: string;
  name: string;
  type: string;
  description: string | null;
  is_active: boolean;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("email");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchChannels() {
    try {
      const res = await fetch("/api/marketing/channels");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChannels(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChannels();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    try {
      const res = await fetch("/api/marketing/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, description: description || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setName("");
      setDescription("");
      await fetchChannels();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/marketing/channels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchChannels();
    } catch (err) {
      setError(String(err));
    }
  }

  if (loading) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Channels</h1>

      <form onSubmit={handleCreate} className="flex gap-3 mb-6 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Channel name"
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
        >
          <option value="email">Email</option>
          <option value="linkedin">LinkedIn</option>
          <option value="phone">Phone</option>
          <option value="sms">SMS</option>
          <option value="other">Other</option>
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Create
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-2">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{ch.name}</p>
              <p className="text-sm text-zinc-400">
                {ch.type} {ch.description ? `— ${ch.description}` : ""}
                {!ch.is_active && " (inactive)"}
              </p>
            </div>
            <button
              onClick={() => handleDelete(ch.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
        {channels.length === 0 && (
          <p className="text-zinc-500 text-sm">No channels yet.</p>
        )}
      </div>
    </div>
  );
}
