import { NextRequest, NextResponse } from "next/server";
import { getChannel, updateChannel } from "@/server/repositories/marketing/channelRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const channel = await getChannel(ctx.workspaceId, params.id);
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(channel);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const channel = await updateChannel(ctx.workspaceId, params.id, body);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "channel.update",
    entity: "channels",
    entity_id: params.id,
  });

  return NextResponse.json(channel);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const { deleteChannel } = await import("@/server/repositories/marketing/channelRepository");
  await deleteChannel(ctx.workspaceId, params.id);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "channel.delete",
    entity: "channels",
    entity_id: params.id,
  });

  return NextResponse.json({ success: true });
}
