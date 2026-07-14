import type { AiKey } from "@/server/repositories/aiKeyRepository";
import type { AiProvider } from "@/lib/ai/provider";
import { createVertexProProvider, createVertexFlashProvider } from "@/lib/ai/vertexProvider";

export async function buildProviderFromDbKey(
  key: AiKey
): Promise<AiProvider> {
  switch (key.provider) {
    case "google": {
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = key.key;
      if (key.model === "flash") {
        return createVertexFlashProvider();
      }
      return createVertexProProvider();
    }
    default:
      throw new Error(`Unsupported AI provider: ${key.provider}`);
  }
}
