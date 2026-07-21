import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface AttributionResult {
  contentId: string;
  firstTouchCalls: number;
  lastTouchCalls: number;
  touchpoints: number;
}

export async function getAttribution(
  workspaceId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AttributionResult[]> {
  const supabase = createServiceSupabaseClient();

  let query = supabase
    .from("touchpoints")
    .select("content_id, kind, metadata")
    .eq("workspace_id", workspaceId)
    .in("kind", ["publish", "inbound_reply", "call_booked", "agreement_signed"]);

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data } = await query;

  const byContent: Record<string, {
    contentId: string;
    touchpoints: number;
    calls: number;
    firstTouch: Date;
    lastTouch: Date;
  }> = {};

  for (const row of data ?? []) {
    if (!row.content_id) continue;
    const cid = row.content_id;
    if (!byContent[cid]) {
      byContent[cid] = {
        contentId: cid,
        touchpoints: 0,
        calls: 0,
        firstTouch: new Date(),
        lastTouch: new Date(0),
      };
    }
    byContent[cid].touchpoints++;
    if (row.kind === "call_booked" || row.kind === "agreement_signed") {
      byContent[cid].calls++;
    }
  }

  return Object.values(byContent).map((c) => ({
    contentId: c.contentId,
    firstTouchCalls: c.calls,
    lastTouchCalls: c.calls,
    touchpoints: c.touchpoints,
  }));
}

export function compareToBaselines(metrics: {
  posts: number;
  calls: number;
  emails: number;
  emailReplies: number;
  dms: number;
  dmReplies: number;
}): Record<string, { actual: number; baseline: number; percent: number }> {
  const baselines = {
    postToCall: { posts: 67, calls: 5 },
    emailToCall: { emails: 590, replies: 34, calls: 17 },
    dmToCall: { dms: 184, replies: 14, calls: 4 },
  };

  return {
    postToCallRatio: {
      actual: metrics.posts > 0 ? metrics.calls / metrics.posts : 0,
      baseline: 5 / 67,
      percent: metrics.posts > 0
        ? ((metrics.calls / metrics.posts) / (5 / 67)) * 100
        : 0,
    },
    emailToCallRatio: {
      actual: metrics.emails > 0 ? metrics.emailReplies / metrics.emails : 0,
      baseline: 17 / 590,
      percent: metrics.emails > 0
        ? ((metrics.emailReplies / metrics.emails) / (17 / 590)) * 100
        : 0,
    },
  };
}
