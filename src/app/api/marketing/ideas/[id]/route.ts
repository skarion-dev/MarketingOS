import { NextRequest, NextResponse } from "next/server";
import { getIdea, updateIdea, deleteIdea } from "@/server/repositories/marketing/ideaRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const idea = await getIdea(ctx.workspaceId, params.id);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const idea = await updateIdea(ctx.workspaceId, params.id, body);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "idea.update",
    entity: "ideas",
    entity_id: params.id,
  });

  return NextResponse.json(idea);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  await deleteIdea(ctx.workspaceId, params.id);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "idea.delete",
    entity: "ideas",
    entity_id: params.id,
  });

  return NextResponse.json({ success: true });
}
