import { getAccessToken } from "./vertexAuth";

export interface GenerateImageResult {
  base64: string;
}

export interface ImageGenerationProvider {
  generateImage(prompt: string): Promise<GenerateImageResult>;
}

export function createVertexImageProvider(): ImageGenerationProvider {
  return {
    async generateImage(prompt: string): Promise<GenerateImageResult> {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
      const model =
        process.env.VERTEX_IMAGE_MODEL || "imagen-3.0-generate-001";

      if (!projectId) {
        throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set");
      }

      const token = await getAccessToken();

      const url =
        `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

      const body = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
        },
      };

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
        throw new Error(`Vertex Imagen API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      const base64: string =
        data.predictions?.[0]?.bytesBase64Encoded ?? "";

      if (!base64) {
        throw new Error("Imagen returned no image data");
      }

      return { base64 };
    },
  };
}
