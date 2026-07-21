import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaign, deleteCampaign } from "@/server/repositories/marketing/campaignRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const campaign = await getCampaign(ctx.workspaceId, params.id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
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
  const campaign = await updateCampaign(ctx.workspaceId, params.id, body);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "campaign.update",
    entity: "campaigns",
    entity_id: params.id,
  });

  return NextResponse.json(campaign);
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

  await deleteCampaign(ctx.workspaceId, params.id);

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "campaign.delete",
    entity: "campaigns",
    entity_id: params.id,
  });

  return NextResponse.json({ success: true });
}
