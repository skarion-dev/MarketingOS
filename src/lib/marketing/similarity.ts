import { getEmbedding } from "@/lib/ai/vertexEmbeddingProvider";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function checkSimilarity(
  text: string,
  existingTexts: string[],
  threshold = 0.85
): Promise<{ duplicates: number[]; maxSimilarity: number }> {
  if (!existingTexts.length) return { duplicates: [], maxSimilarity: 0 };

  const targetEmbedding = await getEmbedding(text);
  const duplicates: number[] = [];
  let maxSimilarity = 0;

  for (let i = 0; i < existingTexts.length; i++) {
    const existing = existingTexts[i];
    if (!existing || existing.length < 20) continue;

    const existingEmbedding = await getEmbedding(existing);
    const sim = cosineSimilarity(targetEmbedding.values, existingEmbedding.values);

    maxSimilarity = Math.max(maxSimilarity, sim);
    if (sim >= threshold) {
      duplicates.push(i);
    }
  }

  return { duplicates, maxSimilarity };
}
