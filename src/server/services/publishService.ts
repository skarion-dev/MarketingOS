import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getContentById, updateContent, updateContentStatus } from "@/server/repositories/marketing/contentRepository";
import { getPublisher } from "@/lib/publish/publisher";
import { formatContent } from "@/lib/publish/format";
import { logAudit } from "@/server/services/audit";
import { getSecretValue } from "@/server/repositories/secretRepository";

const DRY_RUN = process.env.PUBLISH_DRY_RUN === "true";

export async function enqueueContent(
  workspaceId: string,
  contentId: string,
  connectionId: string,
  scheduledAt: string | null
) {
  const supabase = createServiceSupabaseClient();

  const content = await getContentById(workspaceId, contentId);
  if (!content) throw new Error("Content not found");
  if (content.status !== "approved") throw new Error("Content must be approved to publish");

  const { error } = await supabase.from("publish_queue").insert({
    workspace_id: workspaceId,
    content_id: contentId,
    connection_id: connectionId,
    scheduled_at: scheduledAt ?? new Date().toISOString(),
    status: "queued",
  });

  if (error) throw new Error(`Failed to enqueue: ${error.message}`);

  if (scheduledAt) {
    await updateContentStatus(workspaceId, contentId, "scheduled", "system");
  }
}

export async function processPublishBatch(limit = 10) {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();

  const { data: queueItems } = await supabase
    .from("publish_queue")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", now)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!queueItems?.length) return { published: 0, failed: 0 };

  let published = 0;
  let failed = 0;

  for (const item of queueItems) {
    try {
      await supabase
        .from("publish_queue")
        .update({ status: "publishing" })
        .eq("id", item.id);

      const { data: connection } = await supabase
        .from("channel_connections")
        .select("*, channels(kind)")
        .eq("id", item.connection_id)
        .single();

      if (!connection) throw new Error("Connection not found");

      const channelKind = (connection as any).channels?.kind?.replace("linkedin_", "") ?? "blog";
      const content = await getContentById(item.workspace_id, item.content_id);
      if (!content) throw new Error("Content not found");

      if (DRY_RUN) {
        console.log(`[publish] DRY RUN: Would publish content ${item.content_id} to ${channelKind}`);

        await supabase
          .from("publish_queue")
          .update({
            status: "published",
            published_url: `https://dry-run.local/${channelKind}/${item.content_id}`,
            external_id: `dry-run-${item.id}`,
          })
          .eq("id", item.id);

        await updateContent(item.workspace_id, item.content_id, {
          status: "published",
          published_url: `https://dry-run.local/${channelKind}/${item.content_id}`,
          external_id: `dry-run-${item.id}`,
        });

        published++;
        continue;
      }

      const token = await getSecretValue(
        item.workspace_id,
        "oauth_token",
        `${connection.provider}-token`
      );
      if (!token) throw new Error("OAuth token not found");

      const publisher = getPublisher(connection.provider, token);

      const formatted = formatContent(channelKind, {
        title: content.title ?? undefined,
        body: content.body ?? content.hook ?? "",
      });

      const result = await publisher.publish({
        title: content.title ?? undefined,
        body: formatted.body,
      });

      await supabase
        .from("publish_queue")
        .update({
          status: "published",
          published_url: result.url,
          external_id: result.externalId,
        })
        .eq("id", item.id);

      await updateContent(item.workspace_id, item.content_id, {
        status: "published",
        published_url: result.url,
        external_id: result.externalId,
      });

      await logAudit({
        workspace_id: item.workspace_id,
        actor: "system",
        action: "publish.success",
        entity: "content",
        entity_id: item.content_id,
        after: { url: result.url, externalId: result.externalId },
      });

      published++;
    } catch (err: any) {
      console.error(`[publish] Failed for queue item ${item.id}:`, err.message);

      const attempts = (item.attempts ?? 0) + 1;
      const maxAttempts = 3;

      await supabase
        .from("publish_queue")
        .update({
          status: attempts >= maxAttempts ? "failed" : "queued",
          attempts,
          last_error: err.message,
        })
        .eq("id", item.id);

      failed++;
    }
  }

  return { published, failed };
}
