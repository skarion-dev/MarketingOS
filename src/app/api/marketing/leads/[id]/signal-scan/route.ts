import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getActiveProvider } from "@/lib/ai";
import { wrapMetered } from "@/lib/ai/meteredProvider";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const message = body.message as string;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const provider = await getActiveProvider();
    const model = "gemini-2.5-flash-preview-05-06";

    const metered = wrapMetered(provider, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "google",
      model,
      entity: "leads",
      entityId: params.id,
    });

    const result = await metered.send({
      system: "You are a lead scoring assistant. Classify a message for warm signals. Output JSON only.",
      messages: [
        {
          role: "user",
          content: `Analyze this message from a lead. Check for warm signals:
- fee_question: Are they asking about cost/fees?
- booking_request: Do they want to book a call?
- how_it_works: Are they asking how the process works?

Respond with JSON: {"signals": ["fee_question", "booking_request", etc.], "should_raise_temperature": true/false, "reason": "..."}

Message: ${message}`,
        },
      ],
    });

    let analysis: { signals: string[]; should_raise_temperature: boolean; reason: string };
    try {
      analysis = JSON.parse(result.content);
    } catch {
      const content = result.content;
      analysis = {
        signals: [],
        should_raise_temperature:
          content.includes("fee") ||
          content.includes("book") ||
          content.includes("how it works"),
        reason: "AI analysis",
      };
    }

    const supabase = createServiceSupabaseClient();

    if (analysis.should_raise_temperature) {
      const { data: lead } = await supabase
        .from("leads")
        .select("temperature")
        .eq("id", params.id)
        .single();

      if (lead && lead.temperature !== "hot") {
        const newTemp = lead.temperature === "cold" ? "warm" : "hot";
        await supabase
          .from("leads")
          .update({ temperature: newTemp })
          .eq("id", params.id);

        await supabase.from("tasks").insert({
          workspace_id: ctx.workspaceId,
          lead_id: params.id,
          kind: "followup",
          title: `Warm signal detected: ${analysis.signals.join(", ")}`,
          priority: "high",
          status: "open",
        });
      }
    }

    return NextResponse.json({
      signals: analysis.signals,
      should_raise_temperature: analysis.should_raise_temperature,
      reason: analysis.reason,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Signal scan failed: ${err.message}` },
      { status: 500 }
    );
  }
}
