import { getActiveProvider } from "@/lib/ai/index";

export async function scoreProspect(prospectData: {
  company?: string;
  title?: string;
  engagement?: string;
}): Promise<{ score: number; reasoning: string }> {
  const provider = await getActiveProvider();

  const prompt = `Score this lead on a scale of 1-10 based on their fit for B2B fiber network services:
Company: ${prospectData.company || "unknown"}
Title: ${prospectData.title || "unknown"}
Engagement: ${prospectData.engagement || "none"}

Respond with JSON: {"score": <number 1-10>, "reasoning": "<brief explanation>"}`;

  const result = await provider.send({
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 5, reasoning: "Could not parse score" };
  }
}
