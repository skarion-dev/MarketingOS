import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("marketing_prompt_templates").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", params.id).eq("user_id", auth.userId).select().single();
    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
