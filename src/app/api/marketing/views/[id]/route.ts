import { NextRequest, NextResponse } from "next/server";
import { updateSavedView, deleteSavedView } from "@/server/repositories/marketing/savedViewRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const view = await updateSavedView(ctx.workspaceId, params.id, body);
  return NextResponse.json(view);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await deleteSavedView(ctx.workspaceId, params.id);
  return NextResponse.json({ success: true });
}
