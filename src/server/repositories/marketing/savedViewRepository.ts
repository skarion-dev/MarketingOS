import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface SavedView {
  id: string;
  workspace_id: string;
  user_id: string;
  entity: "content" | "ideas" | "campaigns";
  name: string;
  config: Record<string, unknown>;
  view_type: "grid" | "kanban" | "calendar";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSavedViews(
  workspaceId: string,
  entity?: string
): Promise<SavedView[]> {
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("saved_views")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (entity) {
    query = query.eq("entity", entity);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as SavedView[];
}

export async function createSavedView(
  workspaceId: string,
  input: Partial<SavedView> & { user_id: string }
): Promise<SavedView> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("saved_views")
    .insert({ workspace_id: workspaceId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SavedView;
}

export async function updateSavedView(
  workspaceId: string,
  id: string,
  input: Partial<SavedView>
): Promise<SavedView> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("saved_views")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SavedView;
}

export async function deleteSavedView(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("saved_views")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
