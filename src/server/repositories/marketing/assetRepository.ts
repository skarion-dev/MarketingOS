import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface Asset {
  id: string;
  workspace_id: string;
  content_id: string;
  kind: "image" | "carousel" | "doc";
  storage_path: string | null;
  prompt: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getAssets(workspaceId: string, contentId?: string): Promise<Asset[]> {
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("assets")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (contentId) {
    query = query.eq("content_id", contentId);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as Asset[];
}

export async function createAsset(
  workspaceId: string,
  input: { content_id: string; kind: string; storage_path?: string; prompt?: string; created_by: string }
): Promise<Asset> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("assets")
    .insert({ workspace_id: workspaceId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Asset;
}

export async function deleteAsset(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
