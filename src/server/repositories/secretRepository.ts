import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/crypto/secretVault";

export type SecretKind = "ai_key" | "oauth_token" | "api_key";

export interface StoredSecret {
  id: string;
  workspace_id: string;
  kind: SecretKind;
  label: string;
  ciphertext: string;
  created_at: string;
  updated_at: string;
}

export async function storeSecret(
  workspaceId: string,
  kind: SecretKind,
  label: string,
  plaintext: string
): Promise<StoredSecret> {
  const supabase = createServiceSupabaseClient();
  const ciphertext = encrypt(plaintext);

  const { data, error } = await supabase
    .from("workspace_secrets")
    .insert({
      workspace_id: workspaceId,
      kind,
      label,
      ciphertext,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to store secret: ${error.message}`);
  return data as StoredSecret;
}

export async function getSecret(
  workspaceId: string,
  kind: SecretKind,
  label: string
): Promise<StoredSecret | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_secrets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", kind)
    .eq("label", label)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as StoredSecret;
}

export async function getSecretValue(
  workspaceId: string,
  kind: SecretKind,
  label: string
): Promise<string | null> {
  const secret = await getSecret(workspaceId, kind, label);
  if (!secret) return null;
  return decrypt(secret.ciphertext);
}

export async function deleteSecret(
  workspaceId: string,
  kind: SecretKind,
  label: string
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workspace_secrets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("kind", kind)
    .eq("label", label);

  if (error) throw new Error(`Failed to delete secret: ${error.message}`);
}

export async function listSecrets(
  workspaceId: string
): Promise<Omit<StoredSecret, "ciphertext">[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_secrets")
    .select("id, workspace_id, kind, label, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as Omit<StoredSecret, "ciphertext">[];
}
