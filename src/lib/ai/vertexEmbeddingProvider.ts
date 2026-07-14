import { getAccessToken } from "./vertexAuth";

export interface EmbeddingResult {
  values: number[];
}

export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const model = "text-embedding-004";

  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set");

  const token = await getAccessToken();

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      instances: [{ content: text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex Embedding API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { values: data.predictions?.[0]?.embeddings?.values ?? [] };
}
