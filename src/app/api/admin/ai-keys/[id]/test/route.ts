import { NextRequest, NextResponse } from "next/server";
import { getKeyById } from "@/server/repositories/aiKeyRepository";
import { buildProviderFromDbKey } from "@/server/services/aiProvider";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const key = await getKeyById(params.id);
    if (!key) {
      return NextResponse.json({ error: "AI key not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const prompt = body.prompt ?? "Say hello in exactly 3 words.";

    const provider = await buildProviderFromDbKey(key);

    const result = await provider.send({
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
