import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface MarketingChannel {
  id: string;
  user_id: string;
  name: string;
  type: "email" | "linkedin" | "phone" | "sms" | "other";
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getChannels(userId: string): Promise<MarketingChannel[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_channels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch channels: ${error.message}`);
  return (data ?? []) as MarketingChannel[];
}

export async function getChannel(
  id: string,
  userId: string
): Promise<MarketingChannel | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_channels")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as MarketingChannel;
}

export async function createChannel(
  userId: string,
  input: Pick<MarketingChannel, "name" | "type"> & {
    description?: string;
    is_active?: boolean;
  }
): Promise<MarketingChannel> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_channels")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(`Failed to create channel: ${error.message}`);
  return data as MarketingChannel;
}

export async function updateChannel(
  id: string,
  userId: string,
  updates: Partial<
    Pick<MarketingChannel, "name" | "type" | "description" | "is_active">
  >
): Promise<MarketingChannel | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_channels")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as MarketingChannel;
}

export async function deleteChannel(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("marketing_channels")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
