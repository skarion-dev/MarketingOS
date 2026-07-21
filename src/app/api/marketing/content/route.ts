import { NextRequest, NextResponse } from "next/server";
import { getContent, createContent } from "@/server/repositories/marketing/contentRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.split(",");
  const channelId = url.searchParams.get("channelId");
  const campaignId = url.searchParams.get("campaignId");
  const ownerId = url.searchParams.get("ownerId");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const search = url.searchParams.get("search");

  const content = await getContent(ctx.workspaceId, {
    status: status as any,
    channelId: channelId ?? undefined,
    campaignId: campaignId ?? undefined,
    ownerId: ownerId ?? undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
    search: search ?? undefined,
  });

  return NextResponse.json(content);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const content = await createContent(ctx.workspaceId, {
    ...body,
    created_by: ctx.userId,
  });

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "content.create",
    entity: "content",
    entity_id: content.id,
  });

  return NextResponse.json(content, { status: 201 });
}
