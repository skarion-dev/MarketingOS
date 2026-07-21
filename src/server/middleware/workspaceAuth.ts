import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export function parseWorkspaceId(workspaceId: unknown): string | null {
  if (typeof workspaceId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
    return workspaceId;
  }
  return null;
}

export async function resolveWorkspaceContext(workspaceId: string): Promise<WorkspaceContext | null> {
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
    role: member.role as WorkspaceRole,
  };
}

export function requireRole(
  ctx: WorkspaceContext,
  allowedRoles: WorkspaceRole[]
): boolean {
  return allowedRoles.includes(ctx.role);
}
