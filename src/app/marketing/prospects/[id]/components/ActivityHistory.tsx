"use client";

export default function ActivityHistory({ prospectId }: { prospectId: string }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-300 mb-2">Activity History</h3>
      <p className="text-zinc-600 text-sm">Activity log will appear here.</p>
    </div>
  );
}
