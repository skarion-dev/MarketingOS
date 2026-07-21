import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createWorkspaceAuthMiddleware } from "@/server/middleware/requireRole";
import { logAudit } from "@/server/services/audit";

const auth = createWorkspaceAuthMiddleware(["owner", "admin"]);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth(request, { params });
  if (authResult.status !== 200) return authResult;

  const workspaceId = params.id;
  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth(request, { params });
  if (authResult.status !== 200) return authResult;

  const workspaceId = params.id;
  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 }
    );
  }

  if (!["owner", "admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .upsert(
      { workspace_id: workspaceId, user_id: userId, role },
      { onConflict: "workspace_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to add member: ${error.message}` },
      { status: 500 }
    );
  }

  const actor = request.headers.get("x-user-id") ?? "unknown";
  await logAudit({
    workspace_id: workspaceId,
    actor,
    action: "member.add",
    entity: "workspace_members",
    entity_id: data.id,
    after: { userId, role } as Record<string, unknown>,
  });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth(request, { params });
  if (authResult.status !== 200) return authResult;

  const workspaceId = params.id;
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId query parameter required" },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the workspace owner" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return NextResponse.json(
      { error: `Failed to remove member: ${error.message}` },
      { status: 500 }
    );
  }

  const actor = request.headers.get("x-user-id") ?? "unknown";
  await logAudit({
    workspace_id: workspaceId,
    actor,
    action: "member.remove",
    entity: "workspace_members",
    entity_id: memberId,
  });

  return NextResponse.json({ success: true });
}
