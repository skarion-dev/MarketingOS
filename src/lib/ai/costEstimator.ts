const COST_PER_1K: Record<string, number> = {
  "gemini-2.5-pro": 0.00125,
  "gemini-2.5-flash": 0.00015,
  "text-embedding-004": 0.000025,
};

const IMAGE_COST: Record<string, number> = {
  "imagen-3.0-generate-001": 0.02,
};

export function estimateTextCost(model: string, promptTokens: number, completionTokens: number): number {
  const rate = COST_PER_1K[model] ?? 0.001;
  return ((promptTokens + completionTokens) / 1000) * rate;
}

export function estimateImageCost(model: string, count = 1): number {
  return (IMAGE_COST[model] ?? 0.02) * count;
}
