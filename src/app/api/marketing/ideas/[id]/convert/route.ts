import { NextRequest, NextResponse } from "next/server";
import { convertToContent } from "@/server/repositories/marketing/ideaRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const channelId = body.channelId;

  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  try {
    const content = await convertToContent(
      ctx.workspaceId,
      params.id,
      channelId,
      ctx.userId
    );

    await logAudit({
      workspace_id: ctx.workspaceId,
      actor: ctx.userId,
      action: "idea.convert",
      entity: "ideas",
      entity_id: params.id,
      after: { content_id: content.id },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
