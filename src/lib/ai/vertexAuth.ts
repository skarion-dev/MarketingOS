import { GoogleAuth } from "google-auth-library";

let cachedAuth: GoogleAuth | null = null;

function getCredentials(): object {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set");
  }
  return JSON.parse(raw);
}

function getAuth(): GoogleAuth {
  if (!cachedAuth) {
    cachedAuth = new GoogleAuth({
      credentials: getCredentials(),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return cachedAuth;
}

export async function getAccessToken(): Promise<string> {
  const auth = getAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to obtain access token from service account");
  }
  return token.token;
}
