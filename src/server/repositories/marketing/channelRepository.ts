import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface Channel {
  id: string;
  workspace_id: string;
  kind: "linkedin_personal" | "linkedin_page" | "facebook" | "reddit" | "x" | "email" | "blog";
  name: string;
  rules: Record<string, unknown>;
  cadence: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getChannels(workspaceId: string): Promise<Channel[]> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  return (data ?? []) as Channel[];
}

export async function getChannel(workspaceId: string, id: string): Promise<Channel | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();
  return data as Channel | null;
}

export async function createChannel(
  workspaceId: string,
  input: Partial<Channel>
): Promise<Channel> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("channels")
    .insert({ workspace_id: workspaceId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Channel;
}

export async function updateChannel(
  workspaceId: string,
  id: string,
  input: Partial<Channel>
): Promise<Channel> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("channels")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Channel;
}

export async function deleteChannel(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
