import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getContentById, updateContent } from "@/server/repositories/marketing/contentRepository";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";

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
  const { cell, action, count } = body;

  if (!cell || !action) {
    return NextResponse.json({ error: "cell and action required" }, { status: 400 });
  }

  const fieldValue = (content as any)[cell] ?? "";

  const actionPrompts: Record<string, string> = {
    rewrite: `Rewrite the following text to be more compelling and clear while keeping the same meaning:\n\n${fieldValue}`,
    shorten: `Shorten the following text significantly while keeping the core message:\n\n${fieldValue}`,
    expand: `Expand the following text with more detail and examples while keeping the same tone:\n\n${fieldValue}`,
    variants: `Generate ${count ?? 3} different variations of the following text. Number each variant:\n\n${fieldValue}`,
  };

  const prompt = actionPrompts[action];
  if (!prompt) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

  try {
    const provider = await getActiveProvider();
    const model = process.env.VERTEX_TEXT_MODEL ?? "gemini-2.5-pro-preview-05-06";

    const metered = wrapMetered(provider, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "google",
      model,
      entity: "content",
      entityId: params.id,
    });

    const result = await metered.send({
      system: "You are a content editor for Skarion. Maintain Skarion's direct, warm, practical voice. Output only the revised text, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      candidates: action === "variants"
        ? result.content.split(/\n\d+[\.\)]\s*/).filter(Boolean)
        : [result.content],
      action,
      cell,
      usage: result.usage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Cell action failed: ${err.message}` }, { status: 500 });
  }
}
