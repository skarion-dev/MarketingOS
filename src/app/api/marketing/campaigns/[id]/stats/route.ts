import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getCampaign } from "@/server/repositories/marketingRepository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const campaign = await getCampaign(params.id, auth.userId);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const supabase = createServiceSupabaseClient();

    const { count: contentCount } = await supabase
      .from("marketing_content")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", params.id);

    const { count: prospectCount } = await supabase
      .from("marketing_content")
      .select("prospect_id", { count: "exact", head: true })
      .eq("campaign_id", params.id)
      .not("prospect_id", "is", null);

    const { count: oppCount } = await supabase
      .from("marketing_opportunities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", auth.userId);

    return NextResponse.json({
      contentCount: contentCount ?? 0,
      prospectsTouched: prospectCount ?? 0,
      opportunitiesGenerated: oppCount ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
