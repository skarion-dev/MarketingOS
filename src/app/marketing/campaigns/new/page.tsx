"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
  type: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/channels")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setChannels(d);
          if (d.length > 0) setChannelId(d[0].id);
        }
      })
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !channelId) {
      setError("Name and channel are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel_id: channelId,
          status,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          goals: goals || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create");
      }
      const data = await res.json();
      router.push(`/marketing/campaigns/${data.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Channel</label>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Select channel...</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name} ({ch.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Goals</label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={3}
            className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}
