"use client";

import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  prospect_id: string;
  channel_id: string;
  subject: string | null;
  status: string;
  last_message_at: string | null;
  created_at: string;
}

export default function ConversationThread({ prospectId }: { prospectId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketing/conversations").then((r) => r.json()),
      fetch("/api/marketing/channels").then((r) => r.json()),
    ])
      .then(([convos, chs]) => {
        setConversations(
          (Array.isArray(convos) ? convos : []).filter(
            (c: Conversation) => c.prospect_id === prospectId
          )
        );
        setChannels(Array.isArray(chs) ? chs : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [prospectId]);

  async function handleCreate() {
    if (!subject || !channelId) return;
    const res = await fetch("/api/marketing/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospect_id: prospectId, channel_id: channelId, subject }),
    });
    if (res.ok) {
      const created = await res.json();
      setConversations((prev) => [...prev, created]);
      setSubject("");
    }
  }

  if (loading) return <p className="text-zinc-400 text-sm">Loading...</p>;

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Conversation Timeline</h3>

      <div className="flex gap-2 mb-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="border border-zinc-700 bg-zinc-800 rounded px-2 py-1 text-sm flex-1"
        />
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="border border-zinc-700 bg-zinc-800 rounded px-2 py-1 text-sm"
        >
          <option value="">Channel</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name}</option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          disabled={!subject || !channelId}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Log
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="text-zinc-500 text-sm">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <div key={c.id} className="border border-zinc-700 rounded p-3 bg-zinc-800">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{c.subject || "No subject"}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  c.status === "active" ? "bg-green-900 text-green-300" : "bg-zinc-600 text-zinc-300"
                }`}>{c.status}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {c.last_message_at
                  ? `Last message: ${new Date(c.last_message_at).toLocaleString()}`
                  : `Created: ${new Date(c.created_at).toLocaleDateString()}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
