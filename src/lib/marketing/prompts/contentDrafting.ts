export const CONTENT_PROMPTS: Record<string, (context: Record<string, string>) => string> = {
  linkedin_post: (ctx) =>
    `Write a professional LinkedIn post targeting ${ctx.role || "professionals"} at ${ctx.company || "relevant companies"}. The post should be about ${ctx.topic || "industry insights"}. Keep it under 1,300 characters, include a hook and a call-to-action.`,
  cold_email: (ctx) =>
    `Write a cold email to ${ctx.name || "a prospect"} at ${ctx.company || "their company"}. Subject: ${ctx.subject || "Quick question"}. Keep it concise, personalized, and include a clear value proposition.`,
  comment_reply: (ctx) =>
    `Write a thoughtful reply comment to a LinkedIn post about ${ctx.topic || "the topic"}. Be professional, add value, and keep under 500 characters.`,
  dm: (ctx) =>
    `Write a LinkedIn direct message to ${ctx.name || "a prospect"}. Be friendly and conversational. Reference ${ctx.context || "a shared interest or connection"}. Keep under 300 characters.`,
};
