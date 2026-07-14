"use client";

import { useState } from "react";

const PROVIDERS = [
  { id: "google", label: "Google Vertex AI", needsJson: true },
  { id: "anthropic", label: "Anthropic", needsJson: false },
  { id: "nvidia", label: "Nvidia", needsJson: false },
] as const;

const MODELS: Record<string, { id: string; label: string }[]> = {
  google: [
    { id: "pro", label: "Gemini 2.5 Pro" },
    { id: "flash", label: "Gemini 2.5 Flash" },
  ],
};

export default function AiKeyManager() {
  const [provider, setProvider] = useState<string>("google");
  const [keyValue, setKeyValue] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);
  const providerModels = MODELS[provider] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/ai-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyValue, model: model || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Save failed");
      }

      setMessage("Key saved successfully");
      setKeyValue("");
    } catch (err) {
      setMessage(String(err));
    } finally {
      setSaving(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setKeyValue(reader.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">AI Key Manager</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setModel("");
              setKeyValue("");
            }}
            className="w-full border rounded px-3 py-2 bg-zinc-900 text-zinc-100 border-zinc-700"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {providerModels.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-zinc-900 text-zinc-100 border-zinc-700"
            >
              <option value="">Default (Pro)</option>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            {selectedProvider?.needsJson
              ? "Service Account JSON"
              : "API Key"}
          </label>

          {selectedProvider?.needsJson ? (
            <>
              <textarea
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                rows={10}
                placeholder='Paste your service account JSON here...'
                className="w-full border rounded px-3 py-2 bg-zinc-900 text-zinc-100 border-zinc-700 font-mono text-sm"
              />
              <div className="mt-2">
                <label className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-200">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="underline">Or upload a JSON file</span>
                </label>
              </div>
            </>
          ) : (
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="Enter API key..."
              className="w-full border rounded px-3 py-2 bg-zinc-900 text-zinc-100 border-zinc-700"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !keyValue}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Key"}
        </button>

        {message && (
          <p
            className={`text-sm ${
              message.includes("successfully")
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
