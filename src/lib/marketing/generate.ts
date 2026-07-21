import type { AiProvider, AiSendOptions } from "@/lib/ai/provider";
import { extractModelSlug } from "@/lib/ai/meteredProvider";

interface GenerateOptions {
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  channelRules: string;
  context: Record<string, string>;
  kind: string;
  channelType: string;
}

export async function generateContent(options: GenerateOptions) {
  const { provider, model, systemPrompt, channelRules, context, kind, channelType } = options;

  const userMessage = buildUserPrompt(kind, channelType, channelRules, context);
  const modelSlug = extractModelSlug(model);

  const sendOptions: AiSendOptions & { grounding?: boolean } = {
    system: systemPrompt,
    messages: [
      { role: "user", content: userMessage },
    ],
    grounding: kind === "research",
  };

  const result = await provider.send(sendOptions);

  return {
    content: result.content,
    usage: result.usage,
    modelSlug,
  };
}

function buildUserPrompt(
  kind: string,
  channelType: string,
  channelRules: string,
  context: Record<string, string>
): string {
  const contextLines = Object.entries(context)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return [
    `Kind: ${kind}`,
    `Channel: ${channelType}`,
    `Channel rules:\n${channelRules}`,
    contextLines ? `Context:\n${contextLines}` : "",
    "",
    "Generate a draft that follows all channel rules and compliance requirements. Output only the content, no preamble.",
  ].join("\n");
}
