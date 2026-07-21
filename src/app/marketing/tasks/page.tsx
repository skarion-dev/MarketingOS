"use client";

import { useState, useEffect, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  kind: string;
  status: string;
  priority: string;
  due_at: string | null;
  lead_id: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/marketing/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const priorityColors: Record<string, string> = {
    high: "border-red-800 bg-red-950/20",
    medium: "border-yellow-800 bg-yellow-950/10",
    low: "border-zinc-800",
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  const open = tasks.filter((t) => t.status === "open" || t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Tasks</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Open ({open.length})</h2>
        {open.map((task) => (
          <div
            key={task.id}
            className={`border rounded-lg p-3 ${priorityColors[task.priority] ?? "border-zinc-800"} bg-zinc-900`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{task.title}</p>
              <span className="text-xs text-zinc-500">{task.kind}</span>
            </div>
            {task.due_at && (
              <p className="text-xs text-zinc-500 mt-1">
                Due: {new Date(task.due_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
        {open.length === 0 && (
          <p className="text-sm text-zinc-500">No open tasks</p>
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-400">Completed ({done.length})</h2>
          {done.map((task) => (
            <div key={task.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/50 opacity-60">
              <p className="text-sm">{task.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
