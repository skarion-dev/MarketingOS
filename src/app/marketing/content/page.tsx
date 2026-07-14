"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Content {
  id: string;
  campaign_id: string;
  kind: string;
  subject: string | null;
  status: string;
  created_at: string;
}

export default function ContentPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetch("/api/marketing/content")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const filtered = filterStatus ? items.filter((i) => i.status === filterStatus) : items;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">No content found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/marketing/content/${c.id}`}
              className="block border border-zinc-800 rounded-lg p-4 bg-zinc-900 hover:border-zinc-600"
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{c.subject || c.kind}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  c.status === "approved" ? "bg-green-900 text-green-300" :
                  c.status === "sent" ? "bg-blue-900 text-blue-300" :
                  "bg-yellow-900 text-yellow-300"
                }`}>{c.status}</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                {c.kind} · {new Date(c.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
