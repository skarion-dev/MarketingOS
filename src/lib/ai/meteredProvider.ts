import type { AiProvider, AiSendOptions, AiSendResult } from "./provider";
import { estimateTextCost } from "./costEstimator";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { withRetry } from "./withRetry";

export function extractModelSlug(modelId: string): string {
  if (modelId.includes("flash")) return "gemini-2.5-flash";
  if (modelId.includes("pro")) return "gemini-2.5-pro";
  return modelId;
}

export interface MeteredProviderOptions {
  workspaceId: string;
  userId: string;
  provider: string;
  model: string;
  entity?: string;
  entityId?: string;
}

export function wrapMetered(
  inner: AiProvider,
  opts: MeteredProviderOptions
): AiProvider {
  return {
    async send(options: AiSendOptions): Promise<AiSendResult> {
      const result = await withRetry(
        () => inner.send(options),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      const modelSlug = extractModelSlug(opts.model);
      const promptTokens = result.usage?.promptTokens ?? 0;
      const completionTokens = result.usage?.completionTokens ?? 0;
      const costCents = estimateTextCost(modelSlug, promptTokens, completionTokens) * 100;

      const supabase = createServiceSupabaseClient();
      const { error } = await supabase.from("ai_usage_log").insert({
        workspace_id: opts.workspaceId,
        user_id: opts.userId,
        provider: opts.provider,
        model: opts.model,
        kind: "text",
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost_cents: Math.round(costCents * 10000) / 10000,
        entity: opts.entity ?? null,
        entity_id: opts.entityId ?? null,
      });

      if (error) {
        console.error("[ai_usage_log] Failed to log usage:", error);
      }

      return result;
    },
  };
}

export function createMeteredProvider(
  inner: AiProvider,
  opts: MeteredProviderOptions
): AiProvider {
  return wrapMetered(inner, opts);
}
