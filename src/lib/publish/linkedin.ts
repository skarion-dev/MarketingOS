import type { SocialPublisher, PublishContent, PublishResult, MetricsResult } from "./publisher";
import { registerPublisher } from "./publisher";

function createLinkedInPublisher(accessToken: string): SocialPublisher {
  return {
    async publish(content: PublishContent): Promise<PublishResult> {
      const body: Record<string, unknown> = {
        author: "urn:li:person:{person_id}",
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content.body.slice(0, 3000),
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn publish failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      return {
        externalId: data.id ?? "",
        url: `https://www.linkedin.com/feed/update/${data.id ?? ""}`,
      };
    },

    async fetchMetrics(externalId: string): Promise<MetricsResult> {
      const res = await fetch(
        `https://api.linkedin.com/v2/socialActions/${externalId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error(`LinkedIn metrics failed (${res.status})`);

      const data = await res.json();
      return {
        likes: data.likesSummary?.totalLikes ?? 0,
        comments: data.commentsSummary?.totalComments ?? 0,
        shares: data.sharesSummary?.totalShares ?? 0,
        impressions: data.totalSocialActivityCounts?.impressionCount ?? 0,
        clicks: data.totalSocialActivityCounts?.clickCount ?? 0,
      };
    },

    async healthCheck(): Promise<boolean> {
      try {
        const res = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

registerPublisher("linkedin", (token: string) => createLinkedInPublisher(token));
