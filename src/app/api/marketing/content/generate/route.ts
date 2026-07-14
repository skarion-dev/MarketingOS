import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getActiveProvider } from "@/lib/ai/index";
import { createContent } from "@/server/repositories/marketingRepository";
import { CONTENT_PROMPTS } from "@/lib/marketing/prompts/contentDrafting";
import { buildPersonalizationContext } from "@/lib/marketing/personalize";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, prospectId, kind, tone } = await request.json();
    if (!campaignId || !kind) {
      return NextResponse.json({ error: "campaignId and kind required" }, { status: 400 });
    }

    const promptFn = CONTENT_PROMPTS[kind];
    if (!promptFn) return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });

    const context = await buildPersonalizationContext(auth.userId, prospectId);
    if (tone) context.tone = tone;

    const userPrompt = promptFn(context);

    const provider = await getActiveProvider();
    const result = await provider.send({
      system: `You are a professional marketing copywriter. Write in a ${tone || "professional"} tone.`,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = await createContent(auth.userId, {
      campaign_id: campaignId,
      kind,
      body: result.content,
      prospect_id: prospectId || undefined,
      subject: kind === "cold_email" ? context.subject || "Quick question" : undefined,
    });

    return NextResponse.json(content, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
