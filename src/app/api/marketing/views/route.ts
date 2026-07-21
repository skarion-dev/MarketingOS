import { NextRequest, NextResponse } from "next/server";
import { getSavedViews, createSavedView } from "@/server/repositories/marketing/savedViewRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") ?? undefined;

  const views = await getSavedViews(ctx.workspaceId, entity);
  return NextResponse.json(views);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const view = await createSavedView(ctx.workspaceId, { ...body, user_id: ctx.userId });
  return NextResponse.json(view, { status: 201 });
}
