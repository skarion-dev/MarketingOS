import type { SocialPublisher, PublishContent, PublishResult, MetricsResult } from "./publisher";
import { registerPublisher } from "./publisher";

function createFacebookPublisher(accessToken: string, pageId?: string): SocialPublisher {
  const pageToken = accessToken;
  const targetId = pageId ?? "me";

  return {
    async publish(content: PublishContent): Promise<PublishResult> {
      const res = await fetch(`https://graph.facebook.com/v19.0/${targetId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.body.slice(0, 5000),
          access_token: pageToken,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Facebook publish failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      return {
        externalId: data.id ?? "",
        url: `https://www.facebook.com/${data.id ?? ""}`,
      };
    },

    async fetchMetrics(externalId: string): Promise<MetricsResult> {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${externalId}?fields=likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions)&access_token=${pageToken}`
      );

      if (!res.ok) throw new Error(`Facebook metrics failed (${res.status})`);

      const data = await res.json();
      return {
        likes: data.likes?.summary?.total_count ?? 0,
        comments: data.comments?.summary?.total_count ?? 0,
        shares: data.shares?.count ?? 0,
        impressions: data.insights?.data?.[0]?.values?.[0]?.value ?? 0,
        clicks: 0,
      };
    },

    async healthCheck(): Promise<boolean> {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${targetId}?access_token=${pageToken}`
        );
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

registerPublisher("facebook", (token: string, pageId?: string) =>
  createFacebookPublisher(token, pageId)
);
