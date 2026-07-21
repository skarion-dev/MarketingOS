import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign } from "@/server/repositories/marketing/campaignRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

async function resolveWorkspace(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }), ctx: null };
  }
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return { error: NextResponse.json({ error: "Insufficient role" }, { status: 403 }), ctx: null };
  }
  return { error: null, ctx };
}

export async function GET(request: NextRequest) {
  const { error, ctx } = await resolveWorkspace(request);
  if (error) return error;
  const campaigns = await getCampaigns(ctx!.workspaceId);
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await resolveWorkspace(request);
  if (error) return error;

  const body = await request.json();
  const campaign = await createCampaign(ctx!.workspaceId, body);

  await logAudit({
    workspace_id: ctx!.workspaceId,
    actor: ctx!.userId,
    action: "campaign.create",
    entity: "campaigns",
    entity_id: campaign.id,
  });

  return NextResponse.json(campaign, { status: 201 });
}
