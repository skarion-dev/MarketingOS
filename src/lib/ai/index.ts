import type { AiProvider } from "./provider";
import { createVertexProProvider, createVertexFlashProvider } from "./vertexProvider";
import { getActiveKeyByProvider } from "@/server/repositories/aiKeyRepository";
import { buildProviderFromDbKey } from "@/server/services/aiProvider";

export function getActiveProviderSync(): AiProvider {
  const envProvider = process.env.AI_PROVIDER;

  if (envProvider === "google") {
    const model = process.env.VERTEX_TEXT_MODEL;
    if (model?.includes("flash")) {
      return createVertexFlashProvider();
    }
    return createVertexProProvider();
  }

  throw new Error(
    `No AI provider configured. Set AI_PROVIDER=google and related Vertex env vars.`
  );
}

export async function getActiveProvider(): Promise<AiProvider> {
  const envProvider = process.env.AI_PROVIDER;

  if (envProvider === "google") {
    const key = await getActiveKeyByProvider("google");
    if (key) {
      return buildProviderFromDbKey(key);
    }
    const model = process.env.VERTEX_TEXT_MODEL;
    if (model?.includes("flash")) {
      return createVertexFlashProvider();
    }
    return createVertexProProvider();
  }

  if (envProvider && envProvider !== "google") {
    const key = await getActiveKeyByProvider(
      envProvider as "anthropic" | "nvidia"
    );
    if (!key) {
      throw new Error(`No active key found for provider: ${envProvider}`);
    }
    return buildProviderFromDbKey(key);
  }

  const key = await getActiveKeyByProvider("google");
  if (key) {
    return buildProviderFromDbKey(key);
  }

  throw new Error(
    `No AI provider configured. Set AI_PROVIDER=google and related Vertex env vars.`
  );
}

export async function getActiveProviderAsync(): Promise<AiProvider> {
  return getActiveProvider();
}
