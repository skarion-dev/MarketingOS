import { NextRequest, NextResponse } from "next/server";
import { getAssets, createAsset } from "@/server/repositories/marketing/assetRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const contentId = url.searchParams.get("contentId") ?? undefined;

  const assets = await getAssets(ctx.workspaceId, contentId);
  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const asset = await createAsset(ctx.workspaceId, { ...body, created_by: ctx.userId });
  return NextResponse.json(asset, { status: 201 });
}
