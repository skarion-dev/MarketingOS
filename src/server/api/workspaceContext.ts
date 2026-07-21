import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: string;
}

export async function resolveWorkspaceFromHeaders(
  headers: Headers
): Promise<WorkspaceContext | null> {
  const workspaceId = headers.get("x-workspace-id");
  if (!workspaceId) return null;

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!member) return null;

  return {
    userId: user.id,
    workspaceId,
    role: member.role,
  };
}
