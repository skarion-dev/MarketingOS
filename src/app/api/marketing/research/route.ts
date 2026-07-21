import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { topic, kind } = body;

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  try {
    const provider = await getActiveProvider();
    const model = process.env.VERTEX_TEXT_MODEL ?? "gemini-2.5-pro-preview-05-06";

    const metered = wrapMetered(provider, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "google",
      model,
      entity: "research",
    });

    const prompt = kind === "persona"
      ? `Research the pain points and concerns of this target persona for Skarion (career consultation for international students/OPT/STEM OPT): ${topic}. Provide specific insights and relevant context.`
      : kind === "fact_check"
      ? `Fact check the following statement for accuracy regarding US job market, immigration, or telecom/OSP careers. Provide citations where possible. Topic: ${topic}`
      : `Provide a comprehensive research brief on: ${topic}. Focus on career/employment context relevant to international students and recent graduates in the US.`;

    const result = await metered.send({
      system: "You are a research assistant for Skarion, a career consultation firm. Provide factual, well-structured research with sources where possible. Be thorough.",
      messages: [{ role: "user", content: prompt }],
    });

    const supabase = createServiceSupabaseClient();
    const { data: researchRun } = await supabase
      .from("research_runs")
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: ctx.userId,
        subject: topic,
        prompt,
        provider: "google",
        model,
        grounded: kind !== "fact_check",
        result: { content: result.content, citations: extractCitations(result.content) },
        cost_cents: 0,
      } as any)
      .select()
      .single();

    return NextResponse.json({
      research: researchRun,
      content: result.content,
      usage: result.usage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Research failed: ${err.message}` },
      { status: 500 }
    );
  }
}

function extractCitations(text: string): string[] {
  const citations: string[] = [];
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const matches = text.match(urlRegex);
  if (matches) citations.push(...matches);
  return citations;
}
