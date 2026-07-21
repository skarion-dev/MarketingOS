import { NextRequest, NextResponse } from "next/server";
import { getIdeas, createIdea } from "@/server/repositories/marketing/ideaRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const ideas = await getIdeas(ctx.workspaceId);
  return NextResponse.json(ideas);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const idea = await createIdea(ctx.workspaceId, { ...body, created_by: ctx.userId });

  await logAudit({
    workspace_id: ctx.workspaceId,
    actor: ctx.userId,
    action: "idea.create",
    entity: "ideas",
    entity_id: idea.id,
  });

  return NextResponse.json(idea, { status: 201 });
}
