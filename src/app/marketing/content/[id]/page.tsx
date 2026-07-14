"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Content {
  id: string;
  campaign_id: string;
  prospect_id: string | null;
  kind: string;
  subject: string | null;
  body: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing/content/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setContent(null);
        else setContent(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleApprove() {
    const res = await fetch(`/api/marketing/content/${params.id}/approve`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setContent(updated);
    }
  }

  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (!content) return <p className="text-red-400">Content not found.</p>;

  return (
    <div>
      <Link href="/marketing/content" className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
        &larr; Back to content
      </Link>
      <h1 className="text-2xl font-bold mb-2">{content.subject || content.kind}</h1>
      <div className="flex gap-2 mb-4 items-center">
        <span className={`text-xs px-2 py-0.5 rounded ${
          content.status === "approved" ? "bg-green-900 text-green-300" :
          content.status === "sent" ? "bg-blue-900 text-blue-300" :
          "bg-yellow-900 text-yellow-300"
        }`}>{content.status}</span>
        <span className="text-xs text-zinc-500">{content.kind}</span>
      </div>
      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 mb-4">
        <p className="whitespace-pre-wrap text-sm">{content.body}</p>
      </div>
      {content.status === "draft" && (
        <button
          onClick={handleApprove}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
        >
          Approve
        </button>
      )}
      {content.approved_at && (
        <p className="text-xs text-zinc-500 mt-2">
          Approved {new Date(content.approved_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
