export const RESEARCH_PROMPTS: Record<string, (subject: string) => string> = {
  company: (company: string) =>
    `Research the company: ${company}. Provide a summary of their business, key products/services, industry position, recent news, and 3-5 relevant insights for marketing outreach.`,
  contact: (subject: string) =>
    `Research the contact: ${subject}. Find their role, background, recent activity, and any shared connections or interests that could inform a personalized outreach.`,
  competitor: (company: string) =>
    `Analyze the competitive landscape around ${company}. Identify 3-5 competitors, their strengths/weaknesses, market positioning, and differentiation opportunities.`,
};
