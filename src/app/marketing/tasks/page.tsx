"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketing/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      {tasks.length === 0 ? (
        <p className="text-zinc-500 text-sm">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex justify-between items-center">
              <div>
                <p className="font-medium">{t.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    t.priority === "high" ? "bg-red-900 text-red-300" :
                    t.priority === "low" ? "bg-zinc-700 text-zinc-300" :
                    "bg-yellow-900 text-yellow-300"
                  }`}>{t.priority}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{t.status}</span>
                  {t.due_date && (
                    <span className="text-xs text-zinc-500">
                      Due: {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
