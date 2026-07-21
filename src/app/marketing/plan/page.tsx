"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import EditableGrid from "../components/EditableGrid";
import SavedViewsBar from "../components/SavedViewsBar";
import KanbanView from "../components/KanbanView";
import CalendarView from "../components/CalendarView";

interface ContentRow {
  id: string;
  title: string | null;
  hook: string | null;
  status: string;
  kind: string;
  persona: string | null;
  planned_at: string | null;
  channel_id: string;
  created_at: string;
}

export default function PlanPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/marketing/content");
    if (res.ok) setRows((await res.json()) as ContentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleEdit = useCallback(
    async (rowId: string, key: string, value: string | number | null) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
      );
      await fetch(`/api/marketing/content/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    },
    []
  );

  const handleStatusChange = useCallback(
    async (rowId: string, newStatus: string) => {
      await fetch(`/api/marketing/content/${rowId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchContent();
    },
    [fetchContent]
  );

  const columns = [
    { key: "title", label: "Title", editable: true, width: 250 },
    {
      key: "status",
      label: "Status",
      type: "status" as const,
      options: [
        { value: "idea", label: "Idea" },
        { value: "draft", label: "Draft" },
        { value: "in_review", label: "In Review" },
        { value: "approved", label: "Approved" },
        { value: "scheduled", label: "Scheduled" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
      ],
    } as const,
    { key: "kind", label: "Kind", editable: false },
    { key: "persona", label: "Persona", editable: true },
    {
      key: "planned_at",
      label: "Planned",
      type: "date" as const,
      editable: true,
    },
    {
      key: "created_at",
      label: "Created",
      render: (row: Record<string, unknown>) =>
        new Date(String(row.created_at ?? "")).toLocaleDateString(),
    } as const,
  ];

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Plan</h1>
        <button
          onClick={() => router.push("/marketing/content/new")}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Content
        </button>
      </div>

      <SavedViewsBar
        entity="content"
        viewType={viewType}
        onViewChange={setViewType}
        onApplyFilters={() => {}}
      />

      {viewType === "grid" && (
        <EditableGrid
          columns={columns}
          rows={rows as unknown as Record<string, unknown>[]}
          onEdit={handleEdit}
          onRowClick={(row) =>
            router.push(`/marketing/content/${(row as unknown as ContentRow).id}`)
          }
          selectable
          selected={selected}
          onSelectionChange={setSelected}
          sortable
        />
      )}

      {viewType === "kanban" && (
        <KanbanView
          rows={rows}
          onStatusChange={handleStatusChange}
          onRowClick={(id) => router.push(`/marketing/content/${id}`)}
        />
      )}

      {viewType === "calendar" && (
        <CalendarView
          rows={rows}
          onRowClick={(id) => router.push(`/marketing/content/${id}`)}
        />
      )}
    </div>
  );
}
