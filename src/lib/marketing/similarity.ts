import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function findSimilarProspects(
  userId: string,
  embedding: number[],
  limit = 5
): Promise<{ id: string; similarity: number }[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("match_prospects", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
    p_user_id: userId,
  });

  if (error) return [];
  return (data ?? []) as { id: string; similarity: number }[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
