import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function getFirstTouchAttribution(userId: string, prospectId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("marketing_touchpoints")
    .select("campaign_id, channel_id, kind, occurred_at")
    .eq("user_id", userId)
    .eq("prospect_id", prospectId)
    .order("occurred_at", { ascending: true })
    .limit(1);

  return data?.[0] ?? null;
}

export async function getLastTouchAttribution(userId: string, prospectId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("marketing_touchpoints")
    .select("campaign_id, channel_id, kind, occurred_at")
    .eq("user_id", userId)
    .eq("prospect_id", prospectId)
    .order("occurred_at", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

export async function getAttributionReport(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: touchpoints } = await supabase
    .from("marketing_touchpoints")
    .select("campaign_id, channel_id, prospect_id, kind")
    .eq("user_id", userId);

  if (!touchpoints) return { campaigns: {}, channels: {} };

  const campaigns: Record<string, number> = {};
  const channels: Record<string, number> = {};
  const seen = new Set<string>();

  for (const tp of touchpoints) {
    if (tp.prospect_id) {
      const key = `${tp.prospect_id}-${tp.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (tp.campaign_id) campaigns[tp.campaign_id] = (campaigns[tp.campaign_id] || 0) + 1;
      if (tp.channel_id) channels[tp.channel_id] = (channels[tp.channel_id] || 0) + 1;
    }
  }

  return { campaigns, channels };
}
