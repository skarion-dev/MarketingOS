"use client";

export default function ConversationThread({ prospectId }: { prospectId: string }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-300 mb-2">Conversation Timeline</h3>
      <p className="text-zinc-600 text-sm">Conversation history will appear here once linked.</p>
    </div>
  );
}
