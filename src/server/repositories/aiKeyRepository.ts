import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface AiKey {
  id: string;
  user_id: string;
  provider: string;
  key: string;
  model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActiveKeyByProvider(provider: string): Promise<AiKey | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ai_keys")
    .select("*")
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as AiKey;
}

export async function getActiveKeys(): Promise<AiKey[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ai_keys")
    .select("*")
    .eq("is_active", true);

  if (error) return [];
  return (data ?? []) as AiKey[];
}

export async function getKeyById(id: string): Promise<AiKey | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ai_keys")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as AiKey;
}
