import type { SocialPublisher, PublishContent, PublishResult, MetricsResult } from "./publisher";
import { registerPublisher } from "./publisher";

function createXPublisher(accessToken: string): SocialPublisher {
  const enabled = process.env.X_PUBLISHING_ENABLED === "true";

  return {
    async publish(content: PublishContent): Promise<PublishResult> {
      if (!enabled) throw new Error("X publishing is not enabled");

      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content.body.slice(0, 280) }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`X publish failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      const tweetId = data.data?.id ?? "";
      return {
        externalId: tweetId,
        url: tweetId ? `https://twitter.com/i/web/status/${tweetId}` : "",
      };
    },

    async fetchMetrics(externalId: string): Promise<MetricsResult> {
      if (!enabled) throw new Error("X publishing is not enabled");

      const res = await fetch(
        `https://api.twitter.com/2/tweets/${externalId}?tweet.fields=public_metrics`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`X metrics failed (${res.status})`);

      const data = await res.json();
      const metrics = data.data?.public_metrics ?? {};

      return {
        likes: metrics.like_count ?? 0,
        comments: metrics.reply_count ?? 0,
        shares: metrics.retweet_count ?? 0,
        impressions: metrics.impression_count ?? 0,
        clicks: 0,
      };
    },

    async healthCheck(): Promise<boolean> {
      if (!enabled) return false;
      try {
        const res = await fetch("https://api.twitter.com/2/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

registerPublisher("x", (token: string) => createXPublisher(token));
