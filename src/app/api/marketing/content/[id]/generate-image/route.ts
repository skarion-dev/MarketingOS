import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getContentById } from "@/server/repositories/marketing/contentRepository";
import { createAsset } from "@/server/repositories/marketing/assetRepository";
import { createVertexImageProvider } from "@/lib/ai/vertexImageProvider";
import { estimateImageCost } from "@/lib/ai/costEstimator";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const content = await getContentById(ctx.workspaceId, params.id);
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const prompt = body.prompt ?? `Create a visual for: ${content.title ?? content.hook ?? "Skarion content"}`;

  try {
    const imageProvider = createVertexImageProvider();
    const result = await imageProvider.generateImage(prompt);

    const model = process.env.VERTEX_IMAGE_MODEL ?? "imagen-3.0-generate-001";
    const costCents = estimateImageCost(model, 1) * 100;

    const supabase = createServiceSupabaseClient();
    const { error: logError } = await supabase.from("ai_usage_log").insert({
      workspace_id: ctx.workspaceId,
      user_id: ctx.userId,
      provider: "google",
      model,
      kind: "image",
      prompt_tokens: 0,
      completion_tokens: 0,
      cost_cents: Math.round(costCents * 10000) / 10000,
      entity: "content",
      entity_id: params.id,
    });

    const asset = await createAsset(ctx.workspaceId, {
      content_id: params.id,
      kind: "image",
      prompt,
      created_by: ctx.userId,
    });

    return NextResponse.json({
      asset,
      base64: result.base64,
      cost_cents: costCents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Image generation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
