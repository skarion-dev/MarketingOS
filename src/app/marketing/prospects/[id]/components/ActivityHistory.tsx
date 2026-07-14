"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  entity_type: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
}

export default function ActivityHistory({ prospectId }: { prospectId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing/activity?entity_type=prospects&entity_id=${prospectId}`)
      .then((r) => r.json())
      .then((d) => setActivities(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [prospectId]);

  if (loading) return <p className="text-zinc-400 text-sm">Loading...</p>;

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Activity History</h3>
      {activities.length === 0 ? (
        <p className="text-zinc-600 text-sm">No activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <div key={a.id} className="flex justify-between text-sm border-b border-zinc-800 pb-2">
              <div>
                <span className="text-zinc-300">{a.action}</span>
                {Object.keys(a.changes).length > 0 && (
                  <span className="text-zinc-500 ml-2">
                    {Object.entries(a.changes).map(([k, v]) => `${k}: ${String(v)}`).join(", ")}
                  </span>
                )}
              </div>
              <span className="text-zinc-600 text-xs">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
