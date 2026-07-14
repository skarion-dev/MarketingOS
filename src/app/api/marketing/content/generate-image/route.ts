import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createVertexImageProvider } from "@/lib/ai/vertexImageProvider";
import { IMAGE_BRIEFS } from "@/lib/marketing/prompts/imageBriefs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, style } = await request.json();
    const brief = IMAGE_BRIEFS[style] || "";
    const fullPrompt = brief ? `${prompt || ""} ${brief}`.trim() : prompt;

    if (!fullPrompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const provider = createVertexImageProvider();
    const result = await provider.generateImage(fullPrompt);

    return NextResponse.json({ base64: result.base64 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
