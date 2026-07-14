import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getActiveProvider } from "@/lib/ai/index";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { company } = await request.json();
    if (!company) return NextResponse.json({ error: "company required" }, { status: 400 });
    const provider = await getActiveProvider();
    const result = await provider.send({
      messages: [{ role: "user", content: `Analyze the competitive landscape around ${company}. Identify 3-5 key competitors, their market position, pricing strategies, differentiators, and opportunities for a B2B fiber network provider to win business against them.` }],
      grounding: true,
    } as Parameters<typeof provider.send>[0]);
    return NextResponse.json({ content: result.content });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
