import { NextRequest, NextResponse } from "next/server";
import { getContentById, updateContent, deleteContent } from "@/server/repositories/marketing/contentRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const content = await getContentById(ctx.workspaceId, params.id);
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(content);
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
  const content = await updateContent(ctx.workspaceId, params.id, body);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "content.update",
    entity: "content",
    entity_id: params.id,
  });

  return NextResponse.json(content);
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

  await deleteContent(ctx.workspaceId, params.id);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "content.delete",
    entity: "content",
    entity_id: params.id,
  });

  return NextResponse.json({ success: true });
}
