import { createServiceSupabaseClient } from "@/lib/supabase/server";

export function recordTouchpoint(userId: string, input: {
  campaign_id?: string;
  channel_id?: string;
  prospect_id?: string;
  content_id?: string;
  conversation_id?: string;
  kind: "content_sent" | "conversation_logged" | "opportunity_created";
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceSupabaseClient();
  return supabase.from("marketing_touchpoints").insert({
    user_id: userId,
    ...input,
    occurred_at: new Date().toISOString(),
  });
}
