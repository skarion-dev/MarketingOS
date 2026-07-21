import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  theme: string | null;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "active" | "paused" | "completed";
  ai_budget_cents: number;
  created_at: string;
  updated_at: string;
}

export async function getCampaigns(workspaceId: string): Promise<Campaign[]> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Campaign[];
}

export async function getCampaign(workspaceId: string, id: string): Promise<Campaign | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();
  return data as Campaign | null;
}

export async function createCampaign(
  workspaceId: string,
  input: Partial<Campaign>
): Promise<Campaign> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ workspace_id: workspaceId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function updateCampaign(
  workspaceId: string,
  id: string,
  input: Partial<Campaign>
): Promise<Campaign> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function deleteCampaign(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
