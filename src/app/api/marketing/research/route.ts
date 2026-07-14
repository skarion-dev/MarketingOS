import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getActiveProvider } from "@/lib/ai/index";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { RESEARCH_PROMPTS } from "@/lib/marketing/prompts/research";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, promptType } = await request.json();
    if (!subject || !promptType) {
      return NextResponse.json({ error: "subject and promptType required" }, { status: 400 });
    }

    const promptFn = RESEARCH_PROMPTS[promptType as keyof typeof RESEARCH_PROMPTS];
    if (!promptFn) {
      return NextResponse.json({ error: `Unknown promptType: ${promptType}` }, { status: 400 });
    }

    const prompt = promptFn(subject);

    const provider = await getActiveProvider();
    const result = await provider.send({
      messages: [{ role: "user", content: prompt }],
      grounding: true,
    } as Parameters<typeof provider.send>[0]);

    const supabase = createServiceSupabaseClient();
    await supabase.from("marketing_research_runs").insert({
      user_id: auth.userId,
      subject,
      prompt,
      provider: "google",
      grounded: true,
      result,
      cost_cents: 0,
    });

    return NextResponse.json({ content: result.content, usage: result.usage });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
