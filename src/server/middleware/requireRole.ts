import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export function parseWorkspaceId(workspaceId: unknown): string | null {
  if (
    typeof workspaceId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId
    )
  ) {
    return workspaceId;
  }
  return null;
}

export async function resolveWorkspaceContext(
  workspaceId: string
): Promise<WorkspaceContext | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export function createWorkspaceAuthMiddleware(
  allowedRoles: WorkspaceRole[]
) {
  return async function workspaceAuth(
    request: NextRequest,
    { params }: { params: { id?: string } }
  ) {
    const workspaceId = params.id;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    const ctx = await resolveWorkspaceContext(workspaceId);
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!requireRole(ctx, allowedRoles)) {
      return NextResponse.json(
        { error: "Insufficient role" },
        { status: 403 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", ctx.userId);
    requestHeaders.set("x-workspace-id", ctx.workspaceId);
    requestHeaders.set("x-workspace-role", ctx.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  };
}
