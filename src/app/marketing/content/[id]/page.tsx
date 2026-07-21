"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Content {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  channel_id: string;
  kind: string;
  status: string;
  title: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  persona: string | null;
  planned_at: string | null;
  published_url: string | null;
  external_id: string | null;
  lint_result: unknown[];
  metrics: Record<string, unknown>;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const STATUS_ACTIONS: Record<string, { next: string; label: string }[]> = {
  idea: [{ next: "draft", label: "Start Draft" }, { next: "rejected", label: "Reject" }],
  draft: [{ next: "in_review", label: "Send to Review" }, { next: "rejected", label: "Reject" }],
  in_review: [{ next: "approved", label: "Approve" }, { next: "rejected", label: "Reject" }],
  approved: [{ next: "scheduled", label: "Schedule" }, { next: "rejected", label: "Reject" }],
  scheduled: [{ next: "published", label: "Mark Published" }],
  published: [],
  rejected: [{ next: "draft", label: "Reopen" }],
};

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    const res = await fetch(`/api/marketing/content/${params.id}`);
    if (res.ok) setContent(await res.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleFieldUpdate = async (field: string, value: unknown) => {
    if (!content) return;
    setSaving(true);
    const res = await fetch(`/api/marketing/content/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) setContent(await res.json());
    setSaving(false);
  };

  const handleStatusAction = async (newStatus: string) => {
    const res = await fetch(`/api/marketing/content/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContent(updated);
    }
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;
  if (!content) return <div className="p-8 text-red-400">Content not found</div>;

  const actions = STATUS_ACTIONS[content.status] ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Back
        </button>
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.next}
              onClick={() => handleStatusAction(action.next)}
              className={`text-sm px-3 py-1.5 rounded ${
                action.next === "rejected" || action.next === "rejected"
                  ? "bg-red-900/50 text-red-300 hover:bg-red-800/50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">{content.title || "Untitled"}</h1>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            content.status === "published"
              ? "bg-emerald-900 text-emerald-300"
              : content.status === "approved"
              ? "bg-green-900 text-green-300"
              : content.status === "in_review"
              ? "bg-purple-900 text-purple-300"
              : content.status === "draft"
              ? "bg-yellow-900 text-yellow-300"
              : "bg-zinc-700 text-zinc-300"
          }`}
        >
          {content.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-4">
        <FieldRow
          label="Title"
          value={content.title}
          onChange={(v) => handleFieldUpdate("title", v)}
        />
        <FieldRow
          label="Hook"
          value={content.hook}
          onChange={(v) => handleFieldUpdate("hook", v)}
          textarea
        />
        <FieldRow
          label="Body"
          value={content.body}
          onChange={(v) => handleFieldUpdate("body", v)}
          textarea
          rows={8}
        />
        <FieldRow
          label="CTA"
          value={content.cta}
          onChange={(v) => handleFieldUpdate("cta", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <FieldRow
            label="Persona"
            value={content.persona}
            onChange={(v) => handleFieldUpdate("persona", v)}
          />
          <FieldRow
            label="Kind"
            value={content.kind}
            onChange={(v) => handleFieldUpdate("kind", v)}
          />
        </div>
        <FieldRow
          label="Planned Date"
          value={content.planned_at?.slice(0, 10) ?? ""}
          onChange={(v) => handleFieldUpdate("planned_at", v ? new Date(v).toISOString() : null)}
          type="date"
        />
      </div>

      {content.published_url && (
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
          <p className="text-sm text-zinc-400">Published URL</p>
          <a
            href={content.published_url}
            target="_blank"
            className="text-blue-400 text-sm hover:underline"
          >
            {content.published_url}
          </a>
        </div>
      )}

      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
        <p className="text-sm text-zinc-400 mb-2">Metadata</p>
        <p className="text-xs text-zinc-500">
          Created: {new Date(content.created_at).toLocaleString()} ·
          Updated: {new Date(content.updated_at).toLocaleString()} ·
          Channel: {content.channel_id.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  textarea,
  rows,
  type,
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const handleBlur = () => {
    setEditing(false);
    if (draft !== (value ?? "")) {
      onChange(draft);
    }
  };

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="cursor-pointer hover:bg-zinc-800/50 rounded p-2 -mx-2 group"
      >
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className={`text-sm ${value ? "text-zinc-200" : "text-zinc-600 italic"}`}>
          {value || `Click to add ${label.toLowerCase()}`}
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 -mx-2">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      {textarea ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={rows ?? 3}
          className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm resize-y"
          autoFocus
        />
      ) : (
        <input
          type={type ?? "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm"
          autoFocus
        />
      )}
    </div>
  );
}
