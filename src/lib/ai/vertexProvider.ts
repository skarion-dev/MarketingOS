import { getAccessToken } from "./vertexAuth";
import type { AiProvider, AiSendOptions, AiSendResult } from "./provider";

interface VertexSendOptions extends AiSendOptions {
  grounding?: boolean;
}

function createVertexTextProvider(modelId: string): AiProvider {
  return {
    async send(rawOptions: AiSendOptions): Promise<AiSendResult> {
      const options = rawOptions as VertexSendOptions;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

      if (!projectId) {
        throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set");
      }

      const token = await getAccessToken();

      const url =
        `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

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

      const tools: Record<string, unknown>[] = [];

      if (options.tools?.length) {
        tools.push({
          functionDeclarations: options.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        });
      }

      if (options.grounding) {
        tools.push({ googleSearch: {} });
      }

      if (tools.length) {
        body.tools = tools;
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

export function createVertexProProvider(): AiProvider {
  return createVertexTextProvider(
    process.env.VERTEX_TEXT_MODEL || "gemini-2.5-pro-preview-05-06"
  );
}

export function createVertexFlashProvider(): AiProvider {
  return createVertexTextProvider(
    "gemini-2.5-flash-preview-05-06"
  );
}
