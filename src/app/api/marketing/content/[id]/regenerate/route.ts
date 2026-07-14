import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getContent, updateContent } from "@/server/repositories/marketingRepository";
import { getActiveProvider } from "@/lib/ai/index";
import { CONTENT_PROMPTS } from "@/lib/marketing/prompts/contentDrafting";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await getContent(params.id, auth.userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { feedback } = await request.json();

    const provider = await getActiveProvider();
    const result = await provider.send({
      system: "Rewrite the following marketing content based on the feedback provided.",
      messages: [
        { role: "user", content: `Original content:\n${existing.body}\n\nFeedback: ${feedback || "Make it better"}` },
      ],
    });

    const updated = await updateContent(params.id, auth.userId, { body: result.content });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
