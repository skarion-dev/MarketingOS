"use client";

export default function ImagePreview({ base64 }: { base64: string }) {
  if (!base64) return null;
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <img
        src={`data:image/png;base64,${base64}`}
        alt="Generated"
        className="w-full h-auto"
      />
    </div>
  );
}
