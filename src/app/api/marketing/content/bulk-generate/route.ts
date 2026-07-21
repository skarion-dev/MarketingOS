import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getIdeas } from "@/server/repositories/marketing/ideaRepository";
import { createContent } from "@/server/repositories/marketing/contentRepository";
import { getChannel } from "@/server/repositories/marketing/channelRepository";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";
import { generateContent } from "@/lib/marketing/generate";
import { lintContent } from "@/lib/marketing/compliance/lint";
import { checkBudget } from "@/lib/marketing/budget";

const SKARION_SYSTEM_PROMPT = `You are a content writer for Skarion. Write direct, warm, practical content. Short paragraphs, one clear point. No corporate slop, no guarantees, no exaggerated praise. Follow all channel rules. Output the content directly without preamble.`;

const MAX_BATCH = 10;

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const { ideaIds, channelId, campaignId, kind } = body;

  if (!ideaIds?.length || !channelId) {
    return NextResponse.json(
      { error: "ideaIds and channelId are required" },
      { status: 400 }
    );
  }

  if (ideaIds.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BATCH} ideas per batch` },
      { status: 400 }
    );
  }

  const budget = await checkBudget(ctx.workspaceId, campaignId ?? null);
  if (!budget.allowed) {
    return NextResponse.json({ error: budget.message }, { status: 402 });
  }

  const channel = await getChannel(ctx.workspaceId, channelId);
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const results: unknown[] = [];
  const errors: { ideaId: string; error: string }[] = [];

  for (const ideaId of ideaIds) {
    try {
      const idea = await getIdeas(ctx.workspaceId);
      const found = idea.find((i) => i.id === ideaId);
      if (!found) {
        errors.push({ ideaId, error: "Idea not found" });
        continue;
      }

      const provider = await getActiveProvider();
      const model = process.env.VERTEX_TEXT_MODEL ?? "gemini-2.5-pro-preview-05-06";

      const metered = wrapMetered(provider, {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        provider: "google",
        model,
        entity: "content",
      });

      const channelKind = channel.kind.replace("linkedin_", "");
      const channelRules = JSON.stringify(channel.rules ?? {});

      const result = await generateContent({
        provider: metered,
        model,
        systemPrompt: SKARION_SYSTEM_PROMPT,
        channelRules,
        context: {
          topic: found.title,
          persona: found.persona ?? "",
        },
        kind: kind ?? "post",
        channelType: channelKind,
      });

      const parsed = parseGeneratedContent(result.content);
      const lintResult = lintContent({
        kind: (kind ?? "post") as any,
        channelType: channelKind as any,
        title: parsed.title,
        body: parsed.body,
      });

      const content = await createContent(ctx.workspaceId, {
        title: parsed.title || found.title,
        hook: parsed.hook,
        body: parsed.body,
        cta: parsed.cta,
        channel_id: channelId,
        kind: (kind ?? "post") as any,
        campaign_id: campaignId ?? null,
        persona: found.persona ?? undefined,
        status: "draft",
        lint_result: lintResult.violations as any,
        created_by: ctx.userId,
      });

      results.push({ ideaId, contentId: content.id, title: content.title, pass: lintResult.pass });
    } catch (err: any) {
      errors.push({ ideaId, error: err.message });
    }
  }

  return NextResponse.json({
    generated: results.length,
    errors: errors.length > 0 ? errors : undefined,
    results,
  });
}

function parseGeneratedContent(text: string): {
  title?: string;
  hook?: string;
  body: string;
  cta?: string;
} {
  const lines = text.trim().split("\n");
  let title: string | undefined;
  let bodyStart = 0;
  if (lines[0] && lines[0].length < 120 && !lines[0].startsWith("#")) {
    title = lines[0].replace(/^#+\s*/, "").trim();
    bodyStart = 1;
  }
  return { title, body: lines.slice(bodyStart).join("\n").trim() };
}
