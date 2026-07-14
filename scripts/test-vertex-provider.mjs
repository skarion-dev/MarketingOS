import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.log("No .env.local found, using process env vars");
  }
}

loadEnv();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const model =
  process.env.VERTEX_TEXT_MODEL || "gemini-2.5-pro-preview-05-06";
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!projectId) {
  console.error("GOOGLE_CLOUD_PROJECT_ID is not set");
  process.exit(1);
}

if (!credentialsJson) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set");
  process.exit(1);
}

async function main() {
  const { GoogleAuth } = await import("google-auth-library");

  const credentials = JSON.parse(credentialsJson);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse.token) {
    console.error("Failed to obtain access token");
    process.exit(1);
  }

  const url =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: "Say hello in exactly 3 words." }],
      },
    ],
  };

  console.log(`Calling: ${model}`);
  console.log(`URL: ${url}\n`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenResponse.token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error ${response.status}: ${errorText}`);
    process.exit(1);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const content =
    candidate?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  console.log("Response:", content);
  console.log("\nUsage:", JSON.stringify(data.usageMetadata, null, 2));
  console.log("\nSmoke test passed.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
