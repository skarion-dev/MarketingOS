import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getContentById, updateContent } from "@/server/repositories/marketing/contentRepository";
import { getChannel } from "@/server/repositories/marketing/channelRepository";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";
import { generateContent } from "@/lib/marketing/generate";
import { lintContent } from "@/lib/marketing/compliance/lint";

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
  const { feedback } = body;

  const channel = await getChannel(ctx.workspaceId, content.channel_id);
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

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

    const channelKind = channel.kind.replace("linkedin_", "");
    const channelRules = JSON.stringify(channel.rules ?? {});

    const result = await generateContent({
      provider: metered,
      model,
      systemPrompt: "You are editing content for Skarion. Apply the reviewer's feedback to improve the draft while maintaining compliance. Output only the revised content.",
      channelRules,
      context: {
        previous: content.body ?? content.hook ?? "",
        feedback: feedback ?? "Improve the content",
      },
      kind: content.kind,
      channelType: channelKind as string,
    });

    const parsed = parseGeneratedContent(result.content);
    const lintCtx = {
      kind: content.kind as any,
      channelType: channelKind as any,
      title: parsed.title ?? content.title ?? undefined,
      hook: parsed.hook ?? content.hook ?? undefined,
      body: parsed.body ?? content.body ?? undefined,
      cta: parsed.cta ?? content.cta ?? undefined,
    };

    const lintResult = lintContent(lintCtx);

    const updated = await updateContent(ctx.workspaceId, params.id, {
      title: parsed.title || content.title,
      hook: parsed.hook || content.hook,
      body: parsed.body || content.body,
      cta: parsed.cta || content.cta,
      lint_result: lintResult.violations as any,
    });

    return NextResponse.json({ content: updated, lintResult, usage: result.usage });
  } catch (err: any) {
    return NextResponse.json({ error: `Regeneration failed: ${err.message}` }, { status: 500 });
  }
}

function parseGeneratedContent(text: string): {
  title?: string;
  hook?: string;
  body: string;
  cta?: string;
} {
  const lines = text.trim().split("\n");
  let title: string | undefined;
  let hook: string | undefined;
  let cta: string | undefined;
  let bodyStart = 0;

  if (lines[0] && lines[0].length < 120 && !lines[0].startsWith("#")) {
    title = lines[0].replace(/^#+\s*/, "").trim();
    bodyStart = 1;
  }

  const bodyLines = lines.slice(bodyStart);
  let bodyEnd = bodyLines.length;

  for (let i = bodyLines.length - 1; i >= 0; i--) {
    if (
      bodyLines[i].toLowerCase().includes("call to action") ||
      bodyLines[i].toLowerCase().includes("cta:")
    ) {
      cta = bodyLines.slice(i).join("\n").trim();
      bodyEnd = i;
      break;
    }
  }

  const body = bodyLines.slice(0, bodyEnd).join("\n").trim();
  return { title, hook, body, cta };
}
