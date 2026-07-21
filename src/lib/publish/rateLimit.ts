import { createServiceSupabaseClient } from "@/lib/supabase/server";

interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  linkedin: { maxPerMinute: 5, maxPerHour: 50, maxPerDay: 100 },
  facebook: { maxPerMinute: 10, maxPerHour: 100, maxPerDay: 200 },
  reddit: { maxPerMinute: 5, maxPerHour: 30, maxPerDay: 60 },
  x: { maxPerMinute: 1, maxPerHour: 20, maxPerDay: 50 },
};

export async function checkRateLimit(
  connectionId: string,
  provider: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = DEFAULT_LIMITS[provider];
  if (!config) return { allowed: true };

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString();

  const supabase = createServiceSupabaseClient();
  const { count } = await supabase
    .from("publish_queue")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", connectionId)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= config.maxPerMinute) {
    return { allowed: false, retryAfter: 60 };
  }

  return { allowed: true };
}
