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

    const prompt = [
      `Given this content draft:`,
      content.title ? `Title: ${content.title}` : "",
      content.hook ? `Hook: ${content.hook}` : "",
      content.body ? `Body: ${content.body}` : "",
      "",
      "Suggest: 1) Best channel type (post/dm/email/comment/article), 2) Target persona, 3) Best posting time (morning/afternoon/evening). Output as JSON only.",
    ].join("\n");

    const result = await metered.send({
      system: "You are an AI assistant. Output valid JSON only. Example: {\"channel\":\"post\",\"persona\":\"STEM OPT student\",\"bestTime\":\"morning\"}",
      messages: [{ role: "user", content: prompt }],
    });

    let suggestions: Record<string, string> = {};
    try {
      suggestions = JSON.parse(result.content);
    } catch {
      const channel = result.content.match(/channel.*?:\s*(\w+)/i);
      const persona = result.content.match(/persona.*?:\s*(.+)/i);
      const time = result.content.match(/time.*?:\s*(\w+)/i);
      if (channel) suggestions.channel = channel[1];
      if (persona) suggestions.persona = persona[1];
      if (time) suggestions.bestTime = time[1];
    }

    if (Object.keys(suggestions).length === 0) {
      return NextResponse.json({ error: "Failed to parse suggestions" }, { status: 500 });
    }

    const updates: Record<string, string> = {};
    if (suggestions.channel) updates.kind = suggestions.channel;
    if (suggestions.persona) updates.persona = suggestions.persona;

    if (Object.keys(updates).length > 0) {
      await updateContent(ctx.workspaceId, params.id, updates as any);
    }

    return NextResponse.json({ suggestions, applied: updates, usage: result.usage });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Suggest meta failed: ${err.message}` },
      { status: 500 }
    );
  }
}
