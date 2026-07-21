import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getContentById, createContent } from "@/server/repositories/marketing/contentRepository";
import { getChannel } from "@/server/repositories/marketing/channelRepository";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";
import { generateContent } from "@/lib/marketing/generate";
import { lintContent } from "@/lib/marketing/compliance/lint";
import { checkBudget } from "@/lib/marketing/budget";

const SKARION_SYSTEM_PROMPT = `You are a content writer for Skarion, an end-to-end career consultation, preparation, and placement-support firm. Skarion helps candidates (mostly international students and recent grads on OPT/STEM OPT) land jobs. They are strongest in OSP fiber/telecom infrastructure careers.

Writing voice: direct, warm, practical, human, short paragraphs, one clear question or point, no corporate slop, no exaggerated praise, no walls of text.

Core compliance: No guarantees. No "Dear" in emails (use "Hi [Name],"). Never say "free" (use approved fee language). Never invent employer relationships, job openings, placement statistics, or success stories. Never include the booking link before interest is shown. Never mention Skarion Engineering.

Write in skarion's voice. Output the content directly without preamble.`;

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const { ideaId, contentId, channelId, kind, campaignId } = body;

  if (!channelId || !kind) {
    return NextResponse.json(
      { error: "channelId and kind are required" },
      { status: 400 }
    );
  }

  const budget = await checkBudget(ctx.workspaceId, campaignId ?? null);
  if (!budget.allowed) {
    return NextResponse.json({ error: budget.message }, { status: 402 });
  }

  const channel = await getChannel(ctx.workspaceId, channelId);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  let title = "";
  let persona = "";
  let contentRecord = null;

  if (ideaId) {
    const { getIdea } = await import("@/server/repositories/marketing/ideaRepository");
    const idea = await getIdea(ctx.workspaceId, ideaId);
    if (idea) {
      title = idea.title;
      persona = idea.persona ?? "";
    }
  }

  if (contentId) {
    contentRecord = await getContentById(ctx.workspaceId, contentId);
  }

  try {
    const provider = await getActiveProvider();
    const model = process.env.VERTEX_TEXT_MODEL ?? "gemini-2.5-pro-preview-05-06";

    const metered = wrapMetered(provider, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "google",
      model,
      entity: "content",
      entityId: contentId ?? undefined,
    });

    const channelKind = channel.kind.replace("linkedin_", "") as string;
    const channelRules = typeof channel.rules === "string"
      ? channel.rules
      : JSON.stringify(channel.rules ?? {});

    const result = await generateContent({
      provider: metered,
      model,
      systemPrompt: SKARION_SYSTEM_PROMPT,
      channelRules,
      context: {
        topic: title,
        persona,
        ...(contentRecord?.body && { previous: contentRecord.body }),
      },
      kind,
      channelType: channelKind,
    });

    const parsed = parseGeneratedContent(result.content);

    const lintCtx = {
      kind: kind as any,
      channelType: channelKind as any,
      title: parsed.title,
      hook: parsed.hook,
      body: parsed.body,
      cta: parsed.cta,
    };

    const lintResult = lintContent(lintCtx);

    const content = await createContent(ctx.workspaceId, {
      title: parsed.title || title || "AI Generated Draft",
      hook: parsed.hook,
      body: parsed.body,
      cta: parsed.cta,
      channel_id: channelId,
      kind: kind as any,
      campaign_id: campaignId ?? null,
      persona: persona || undefined,
      status: "draft",
      lint_result: lintResult.violations as any,
      created_by: ctx.userId,
    });

    return NextResponse.json({
      content,
      lintResult,
      usage: result.usage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Generation failed: ${err.message}` },
      { status: 500 }
    );
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

  if (lines[0] && !lines[0].startsWith("#") && lines[0].length < 120) {
    title = lines[0].replace(/^#+\s*/, "").trim();
    bodyStart = 1;
  }

  const bodyLines = lines.slice(bodyStart);
  let bodyEnd = bodyLines.length;

  for (let i = bodyLines.length - 1; i >= 0; i--) {
    const line = bodyLines[i].toLowerCase();
    if (
      line.includes("call to action") ||
      line.includes("cta:") ||
      line.includes("next step") ||
      (line.trim().endsWith("?") && i > bodyLines.length - 4)
    ) {
      cta = bodyLines.slice(i).join("\n").trim();
      bodyEnd = i;
      break;
    }
  }

  const body = bodyLines.slice(0, bodyEnd).join("\n").trim();

  return { title, hook, body, cta };
}
