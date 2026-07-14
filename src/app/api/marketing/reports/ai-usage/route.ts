import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServiceSupabaseClient();
    const { data: runs } = await supabase
      .from("marketing_research_runs")
      .select("cost_cents, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const totalCents = (runs ?? []).reduce((sum, r) => sum + (r.cost_cents ?? 0), 0);
    return NextResponse.json({ totalCents, runs: runs ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
