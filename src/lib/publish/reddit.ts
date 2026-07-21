import type { SocialPublisher, PublishContent, PublishResult, MetricsResult } from "./publisher";
import { registerPublisher } from "./publisher";

function createRedditPublisher(accessToken: string): SocialPublisher {
  return {
    async publish(content: PublishContent): Promise<PublishResult> {
      const subreddit = content.url?.match(/r\/(\w+)/)?.[1] ?? "careerguidance";

      const res = await fetch("https://oauth.reddit.com/api/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MarketingOS/1.0 by skarion",
        },
        body: new URLSearchParams({
          sr: subreddit,
          kind: "self",
          title: content.title?.slice(0, 300) ?? "Discussion",
          text: content.body,
          api_type: "json",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Reddit publish failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      const postId = data.json?.data?.id ?? "";
      const permalink = data.json?.data?.permalink ?? "";

      return {
        externalId: postId,
        url: permalink ? `https://www.reddit.com${permalink}` : "",
      };
    },

    async fetchMetrics(externalId: string): Promise<MetricsResult> {
      const res = await fetch(
        `https://oauth.reddit.com/api/info?id=t3_${externalId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "MarketingOS/1.0 by skarion",
          },
        }
      );

      if (!res.ok) throw new Error(`Reddit metrics failed (${res.status})`);

      const data = await res.json();
      const post = data.data?.children?.[0]?.data ?? {};

      return {
        likes: post.ups ?? 0,
        comments: post.num_comments ?? 0,
        shares: 0,
        impressions: post.view_count ?? 0,
        clicks: 0,
      };
    },

    async healthCheck(): Promise<boolean> {
      try {
        const res = await fetch("https://oauth.reddit.com/api/v1/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "MarketingOS/1.0 by skarion",
          },
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

registerPublisher("reddit", (token: string) => createRedditPublisher(token));
