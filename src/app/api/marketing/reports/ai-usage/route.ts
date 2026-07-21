import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = createServiceSupabaseClient();
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("cost_cents, prompt_tokens, completion_tokens, model, created_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  const totalCostCents = (usage ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.cost_cents ?? 0), 0
  );
  const totalTokens = (usage ?? []).reduce(
    (sum: number, r: any) =>
      sum + (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0),
    0
  );

  return NextResponse.json({
    totalCalls: usage?.length ?? 0,
    totalCostCents,
    totalTokens,
    usage,
  });
}
