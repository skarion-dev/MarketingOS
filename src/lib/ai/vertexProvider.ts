import { getAccessToken } from "./vertexAuth";
import type { AiProvider, AiSendOptions, AiSendResult } from "./provider";

export function createVertexProProvider(): AiProvider {
  return {
    async send(options: AiSendOptions): Promise<AiSendResult> {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
      const model = process.env.VERTEX_TEXT_MODEL || "gemini-2.5-pro-preview-05-06";

      if (!projectId) {
        throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set");
      }

      const token = await getAccessToken();

      const url =
        `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

      const contents = options.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const body: Record<string, unknown> = {
        contents,
      };

      if (options.system) {
        body.systemInstruction = {
          parts: [{ text: options.system }],
        };
      }

      if (options.tools?.length) {
        body.tools = [
          {
            functionDeclarations: options.tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ];
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      const candidate = data.candidates?.[0];
      const content =
        candidate?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";

      return {
        content,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount ?? 0,
              completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
            }
          : undefined,
      };
    },
  };
}
