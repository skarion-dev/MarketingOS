import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface WorkspaceSetting {
  id: string;
  workspace_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export async function getSetting(
  workspaceId: string,
  key: string
): Promise<string | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("value")
    .eq("workspace_id", workspaceId)
    .eq("key", key)
    .single();

  if (error) return null;
  return data?.value ?? null;
}

export async function getAllSettings(
  workspaceId: string
): Promise<Record<string, string>> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("key, value")
    .eq("workspace_id", workspaceId);

  if (error || !data) return {};
  const settings: Record<string, string> = {};
  for (const row of data) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setSetting(
  workspaceId: string,
  key: string,
  value: string
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workspace_settings")
    .upsert(
      { workspace_id: workspaceId, key, value },
      { onConflict: "workspace_id,key" }
    );

  if (error) throw new Error(`Failed to set setting: ${error.message}`);
}

export async function setManySettings(
  workspaceId: string,
  settings: Record<string, string>
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const rows = Object.entries(settings).map(([key, value]) => ({
    workspace_id: workspaceId,
    key,
    value,
  }));

  const { error } = await supabase
    .from("workspace_settings")
    .upsert(rows, { onConflict: "workspace_id,key" });

  if (error) throw new Error(`Failed to set settings: ${error.message}`);
}

export async function deleteSetting(
  workspaceId: string,
  key: string
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workspace_settings")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("key", key);

  if (error) throw new Error(`Failed to delete setting: ${error.message}`);
}
