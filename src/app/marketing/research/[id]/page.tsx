"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ResearchDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/marketing/research/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <Link href="/marketing/research" className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold mb-2">{String(data.subject ?? "")}</h1>
      <p className="text-xs text-zinc-500 mb-4">{String(data.prompt_type ?? "")} · {new Date(String(data.created_at ?? "")).toLocaleString()}</p>
      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Prompt</h3>
        <p className="text-sm text-zinc-400 mb-4 whitespace-pre-wrap">{String(data.prompt ?? "")}</p>
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Result</h3>
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(data.result, null, 2)}</pre>
      </div>
    </div>
  );
}
