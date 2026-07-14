import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("marketing_touchpoints")
      .select("channel_id")
      .eq("user_id", auth.userId);

    const counts: Record<string, number> = {};
    for (const tp of data ?? []) {
      if (tp.channel_id) counts[tp.channel_id] = (counts[tp.channel_id] || 0) + 1;
    }
    return NextResponse.json(counts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
