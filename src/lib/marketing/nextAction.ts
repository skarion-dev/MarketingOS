import { getActiveProvider } from "@/lib/ai/index";

export async function suggestNextAction(
  conversationHistory: string
): Promise<{ action: string; rationale: string }> {
  const provider = await getActiveProvider();

  const prompt = `Given this conversation history, suggest the next best follow-up action for a B2B sales rep. Respond with JSON: {"action": "<specific action>", "rationale": "<why this action>"}

Conversation history:
${conversationHistory}`;

  const result = await provider.send({
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: "Follow up via email", rationale: "Maintain engagement" };
  }
}
