"use client";

import { useState, useEffect, useCallback } from "react";

interface Connection {
  id: string;
  provider: string;
  account_label: string | null;
  status: string;
  last_health_check: string | null;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    const res = await fetch("/api/marketing/channel-connections");
    if (res.ok) setConnections(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnect = (provider: string) => {
    window.location.href = `/api/marketing/connect/${provider}/start`;
  };

  const handleDisconnect = async (id: string) => {
    await fetch("/api/marketing/channel-connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchConnections();
  };

  const handleHealthCheck = async (id: string) => {
    await fetch(`/api/marketing/connections/${id}/health`);
    fetchConnections();
  };

  const providers = [
    { id: "linkedin", label: "LinkedIn", connected: connections.some((c) => c.provider === "linkedin" && c.status === "connected") },
    { id: "facebook", label: "Facebook", connected: connections.some((c) => c.provider === "facebook" && c.status === "connected") },
    { id: "reddit", label: "Reddit", connected: connections.some((c) => c.provider === "reddit" && c.status === "connected") },
    { id: "x", label: "X (Twitter)", connected: connections.some((c) => c.provider === "x" && c.status === "connected") },
  ];

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Channel Connections</h1>

      <div className="space-y-3">
        {providers.map((provider) => {
          const conn = connections.find(
            (c) => c.provider === provider.id
          );
          return (
            <div
              key={provider.id}
              className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{provider.label}</p>
                {conn ? (
                  <p className="text-sm">
                    <span
                      className={
                        conn.status === "connected"
                          ? "text-green-400"
                          : conn.status === "error"
                          ? "text-red-400"
                          : "text-zinc-500"
                      }
                    >
                      {conn.status}
                    </span>
                    {conn.last_health_check && (
                      <span className="text-zinc-600 ml-2">
                        Checked: {new Date(conn.last_health_check).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">Not connected</p>
                )}
              </div>
              <div className="flex gap-2">
                {conn?.status === "connected" ? (
                  <>
                    <button
                      onClick={() => handleHealthCheck(conn.id)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Check
                    </button>
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(provider.id)}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
