"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  useEffect(() => {
    async function load() {
      const [settingsRes, membersRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/settings`),
        fetch(`/api/workspaces/${workspaceId}/members`),
      ]);
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/workspaces/${workspaceId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  async function handleRemoveMember(memberId: string) {
    await fetch(
      `/api/workspaces/${workspaceId}/members?memberId=${memberId}`,
      { method: "DELETE" }
    );
    setMembers((m) => m.filter((x) => x.id !== memberId));
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: members.find((m) => m.id === memberId)?.user_id, role: newRole }),
    });
    setMembers((m) =>
      m.map((x) => (x.id === memberId ? { ...x, role: newRole } : x))
    );
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Workspace Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="grid gap-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">{key}</label>
              <input
                className="border rounded px-3 py-2"
                value={value}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <div>
                <p className="font-medium">{member.user_id}</p>
                <p className="text-sm text-gray-500">
                  Joined: {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                {member.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
