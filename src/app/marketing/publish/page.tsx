"use client";

import { useState, useEffect, useCallback } from "react";

interface QueueItem {
  id: string;
  content_id: string;
  scheduled_at: string | null;
  status: string;
  attempts: number;
  last_error: string | null;
  published_url: string | null;
  created_at: string;
}

export default function PublishPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/marketing/publish-queue");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleRetry = async (id: string) => {
    await fetch("/api/marketing/publish-queue/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchQueue();
  };

  const handleCancel = async (id: string) => {
    await fetch("/api/marketing/publish-queue/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchQueue();
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  const upcoming = items.filter((i) => i.status === "queued" || i.status === "publishing");
  const completed = items.filter((i) => i.status === "published");
  const failed = items.filter((i) => i.status === "failed");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Publish Queue</h1>

      {failed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-red-400">
            Failed ({failed.length})
          </h2>
          {failed.map((item) => (
            <div
              key={item.id}
              className="border border-red-900/50 rounded-lg p-4 bg-red-950/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">
                    Content: {item.content_id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-red-400 mt-1">{item.last_error}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Attempts: {item.attempts}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetry(item.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => handleCancel(item.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Upcoming ({upcoming.length})</h2>
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="border border-zinc-800 rounded-lg p-3 bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Content: {item.content_id.slice(0, 8)}...</p>
                  {item.scheduled_at && (
                    <p className="text-xs text-zinc-500">
                      Scheduled: {new Date(item.scheduled_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <span className="text-xs text-yellow-400">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-400">
            Published ({completed.length})
          </h2>
          {completed.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{item.published_url ?? "No URL"}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-green-400">Published</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-zinc-500 text-sm">No items in the publish queue.</p>
      )}
    </div>
  );
}
