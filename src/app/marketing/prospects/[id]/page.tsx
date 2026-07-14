"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Prospect {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  type: string;
  source: string | null;
  stage: string;
  notes: string | null;
  status: string;
  dedupe_key: string;
  created_at: string;
}

export default function ProspectDetailPage() {
  const params = useParams();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing/prospects/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setProspect(null);
        else setProspect(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (!prospect) return <p className="text-red-400">Prospect not found.</p>;

  return (
    <div>
      <Link href="/marketing/prospects" className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
        &larr; Back to prospects
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        {prospect.first_name || prospect.last_name
          ? `${prospect.first_name ?? ""} ${prospect.last_name ?? ""}`.trim()
          : prospect.email || prospect.company || "Unnamed"}
      </h1>
      <div className="flex gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {prospect.stage}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {prospect.type}
        </span>
      </div>

      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 space-y-2 text-sm">
        {prospect.email && (
          <p><span className="text-zinc-400">Email:</span> {prospect.email}</p>
        )}
        {prospect.company && (
          <p><span className="text-zinc-400">Company:</span> {prospect.company}</p>
        )}
        {prospect.title && (
          <p><span className="text-zinc-400">Title:</span> {prospect.title}</p>
        )}
        {prospect.linkedin_url && (
          <p>
            <span className="text-zinc-400">LinkedIn:</span>{" "}
            <a href={prospect.linkedin_url} target="_blank" className="text-blue-400 hover:underline">
              {prospect.linkedin_url}
            </a>
          </p>
        )}
        {prospect.source && (
          <p><span className="text-zinc-400">Source:</span> {prospect.source}</p>
        )}
        {prospect.notes && (
          <p><span className="text-zinc-400">Notes:</span> {prospect.notes}</p>
        )}
        <p><span className="text-zinc-400">Dedupe Key:</span> <code className="text-xs">{prospect.dedupe_key}</code></p>
        <p><span className="text-zinc-400">Created:</span> {new Date(prospect.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
