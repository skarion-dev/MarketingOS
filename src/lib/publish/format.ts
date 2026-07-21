import type { PublishContent } from "./publisher";

interface ChannelFormatRules {
  maxLength: number;
  hashtags?: number;
  stripMarkdown: boolean;
  allowLinks: boolean;
}

const CHANNEL_RULES: Record<string, ChannelFormatRules> = {
  linkedin: { maxLength: 3000, hashtags: 5, stripMarkdown: true, allowLinks: true },
  facebook: { maxLength: 5000, hashtags: 3, stripMarkdown: true, allowLinks: true },
  reddit: { maxLength: 40000, hashtags: 0, stripMarkdown: true, allowLinks: false },
  x: { maxLength: 280, hashtags: 2, stripMarkdown: true, allowLinks: true },
  email: { maxLength: Infinity, hashtags: 0, stripMarkdown: false, allowLinks: true },
  blog: { maxLength: Infinity, hashtags: 0, stripMarkdown: false, allowLinks: true },
};

export function formatContent(
  channel: string,
  content: PublishContent
): { body: string; truncated: boolean } {
  const rules = CHANNEL_RULES[channel] ?? CHANNEL_RULES.blog;

  let body = content.body;

  if (rules.stripMarkdown) {
    body = body
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "");
  }

  if (!rules.allowLinks) {
    body = body.replace(/https?:\/\/[^\s]+/g, "[link removed]");
  }

  if (rules.hashtags) {
    const existingHashtags = body.match(/#\w+/g) ?? [];
    if (existingHashtags.length > rules.hashtags) {
      for (const tag of existingHashtags.slice(rules.hashtags)) {
        body = body.replace(tag, tag.replace("#", ""));
      }
    }
  }

  let truncated = false;
  if (body.length > rules.maxLength) {
    body = body.slice(0, rules.maxLength - 3) + "...";
    truncated = true;
  }

  return { body, truncated };
}
