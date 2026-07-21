import { NextRequest, NextResponse } from "next/server";
import { getChannels, getChannel, createChannel, updateChannel, deleteChannel } from "@/server/repositories/marketing/channelRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

async function resolveWorkspace(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }), ctx: null };
  }
  return { error: null, ctx };
}

export async function GET(request: NextRequest) {
  const { error, ctx } = await resolveWorkspace(request);
  if (error) return error;
  const channels = await getChannels(ctx!.workspaceId);
  return NextResponse.json(channels);
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await resolveWorkspace(request);
  if (error) return error;
  if (!["owner", "admin"].includes(ctx!.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const channel = await createChannel(ctx!.workspaceId, body);

  await logAudit({
    workspace_id: ctx!.workspaceId,
    actor: ctx!.userId,
    action: "channel.create",
    entity: "channels",
    entity_id: channel.id,
  });

  return NextResponse.json(channel, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { error, ctx } = await resolveWorkspace(request);
  if (error) return error;
  if (!["owner", "admin"].includes(ctx!.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await deleteChannel(ctx!.workspaceId, id);

  await logAudit({
    workspace_id: ctx!.workspaceId,
    actor: ctx!.userId,
    action: "channel.delete",
    entity: "channels",
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
