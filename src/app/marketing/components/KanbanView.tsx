"use client";

import { useState } from "react";

interface ContentRow {
  id: string;
  title: string | null;
  status: string;
  kind: string;
}

const STATUSES = [
  "idea",
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
];

const STATUS_LABELS: Record<string, string> = {
  idea: "Ideas",
  draft: "Drafts",
  in_review: "In Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "border-zinc-600",
  draft: "border-yellow-700",
  in_review: "border-purple-700",
  approved: "border-green-700",
  scheduled: "border-blue-700",
  published: "border-emerald-700",
};

export default function KanbanView({
  rows,
  onStatusChange,
  onRowClick,
}: {
  rows: ContentRow[];
  onStatusChange: (id: string, newStatus: string) => void;
  onRowClick: (id: string) => void;
}) {
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const lanes = STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    items: rows.filter((r) => r.status === status),
  }));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onStatusChange(id, status);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {lanes.map((lane) => (
        <div
          key={lane.status}
          className={`flex-shrink-0 w-64 rounded-lg border ${
            dragOverStatus === lane.status
              ? "border-blue-500 bg-blue-950/20"
              : STATUS_COLORS[lane.status] ?? "border-zinc-800"
          } bg-zinc-900/50`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus(lane.status);
          }}
          onDragLeave={() => setDragOverStatus(null)}
          onDrop={(e) => handleDrop(e, lane.status)}
        >
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {lane.label}
            </span>
            <span className="text-xs text-zinc-500">{lane.items.length}</span>
          </div>
          <div className="p-2 space-y-2 min-h-[200px]">
            {lane.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onClick={() => onRowClick(item.id)}
                className="bg-zinc-800 border border-zinc-700 rounded p-2 cursor-pointer hover:border-zinc-500 text-sm"
              >
                <p className="text-zinc-200 truncate">
                  {item.title || item.kind}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.kind}</p>
              </div>
            ))}
            {lane.items.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">
                Drop here
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
