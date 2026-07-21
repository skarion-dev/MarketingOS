import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getPublisher } from "@/lib/publish/publisher";
import { getSecretValue } from "@/server/repositories/secretRepository";

export async function GET() {
  const supabase = createServiceSupabaseClient();

  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: published } = await supabase
    .from("content")
    .select("id, workspace_id, channel_id, external_id")
    .eq("status", "published")
    .not("external_id", "is", null)
    .gte("updated_at", cutoff)
    .limit(50);

  let synced = 0;
  let failed = 0;

  for (const content of published ?? []) {
    try {
      const { data: connection } = await supabase
        .from("channel_connections")
        .select("provider")
        .eq("channel_id", content.channel_id)
        .eq("workspace_id", content.workspace_id)
        .single();

      if (!connection) continue;

      const token = await getSecretValue(
        content.workspace_id,
        "oauth_token",
        `${connection.provider}-token`
      );
      if (!token) continue;

      const publisher = getPublisher(connection.provider, token);
      const metrics = await publisher.fetchMetrics(content.external_id!);

      await supabase.from("metric_snapshots").insert({
        workspace_id: content.workspace_id,
        content_id: content.id,
        connection_id: "",
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        raw: metrics,
      });

      await supabase
        .from("content")
        .update({
          metrics: {
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            last_synced: now.toISOString(),
          },
        })
        .eq("id", content.id);

      synced++;
    } catch (err: any) {
      console.error(`[metrics-sync] Failed for content ${content.id}:`, err.message);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    synced,
    failed,
    timestamp: now.toISOString(),
  });
}
