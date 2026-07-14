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

export interface MarketingCampaign {
  id: string;
  user_id: string;
  channel_id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  start_date: string | null;
  end_date: string | null;
  goals: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCampaigns(userId: string): Promise<MarketingCampaign[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);
  return (data ?? []) as MarketingCampaign[];
}

export async function getCampaign(
  id: string,
  userId: string
): Promise<MarketingCampaign | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as MarketingCampaign;
}

export async function createCampaign(
  userId: string,
  input: Pick<MarketingCampaign, "name" | "channel_id"> & {
    status?: MarketingCampaign["status"];
    start_date?: string;
    end_date?: string;
    goals?: string;
  }
): Promise<MarketingCampaign> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data as MarketingCampaign;
}

export async function updateCampaign(
  id: string,
  userId: string,
  updates: Partial<
    Pick<
      MarketingCampaign,
      "name" | "channel_id" | "status" | "start_date" | "end_date" | "goals"
    >
  >
): Promise<MarketingCampaign | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as MarketingCampaign;
}

export async function deleteCampaign(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("marketing_campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

export interface MarketingProspect {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  type: "individual" | "company";
  source: string | null;
  stage: "new" | "contacted" | "qualified" | "nurturing" | "unqualified";
  dedupe_key: string;
  notes: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export async function getProspects(userId: string): Promise<MarketingProspect[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_prospects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch prospects: ${error.message}`);
  return (data ?? []) as MarketingProspect[];
}

export async function getProspect(
  id: string,
  userId: string
): Promise<MarketingProspect | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_prospects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as MarketingProspect;
}

export async function findByDedupeKey(
  userId: string,
  dedupeKey: string
): Promise<MarketingProspect | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_prospects")
    .select("*")
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey)
    .single();

  if (error) return null;
  return data as MarketingProspect;
}

export async function createProspect(
  userId: string,
  input: Pick<MarketingProspect, "dedupe_key"> & {
    first_name?: string;
    last_name?: string;
    email?: string;
    company?: string;
    title?: string;
    linkedin_url?: string;
    type?: MarketingProspect["type"];
    source?: string;
    stage?: MarketingProspect["stage"];
    notes?: string;
  }
): Promise<MarketingProspect> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_prospects")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) throw new Error(`Failed to create prospect: ${error.message}`);
  return data as MarketingProspect;
}

export async function updateProspect(
  id: string,
  userId: string,
  updates: Partial<
    Pick<
      MarketingProspect,
      | "first_name"
      | "last_name"
      | "email"
      | "company"
      | "title"
      | "linkedin_url"
      | "type"
      | "source"
      | "stage"
      | "notes"
      | "status"
    >
  >
): Promise<MarketingProspect | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_prospects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as MarketingProspect;
}

export async function deleteProspect(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("marketing_prospects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

export interface MarketingContent {
  id: string;
  user_id: string;
  campaign_id: string;
  prospect_id: string | null;
  kind: "linkedin_post" | "cold_email" | "comment_reply" | "dm" | "other";
  subject: string | null;
  body: string;
  status: "draft" | "approved" | "sent";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getContentList(userId: string): Promise<MarketingContent[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_content")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch content: ${error.message}`);
  return (data ?? []) as MarketingContent[];
}

export async function getContent(
  id: string,
  userId: string
): Promise<MarketingContent | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_content")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as MarketingContent;
}

export async function createContent(
  userId: string,
  input: Pick<MarketingContent, "campaign_id" | "kind" | "body"> & {
    prospect_id?: string;
    subject?: string;
  }
): Promise<MarketingContent> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_content")
    .insert({ user_id: userId, status: "draft", ...input })
    .select()
    .single();

  if (error) throw new Error(`Failed to create content: ${error.message}`);
  return data as MarketingContent;
}

export async function updateContent(
  id: string,
  userId: string,
  updates: Partial<
    Pick<
      MarketingContent,
      "campaign_id" | "prospect_id" | "kind" | "subject" | "body" | "status"
    >
  >
): Promise<MarketingContent | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_content")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as MarketingContent;
}

export async function approveContent(
  id: string,
  userId: string,
  approverId: string
): Promise<MarketingContent | null> {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("marketing_content")
    .update({
      status: "approved",
      approved_by: approverId,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return null;
  return data as MarketingContent;
}

export async function deleteContent(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("marketing_content")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
