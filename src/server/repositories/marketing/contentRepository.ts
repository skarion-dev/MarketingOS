import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { logAudit } from "@/server/services/audit";

export type ContentKind = "post" | "dm" | "email" | "comment" | "article";
export type ContentStatus = "idea" | "draft" | "in_review" | "approved" | "scheduled" | "published" | "rejected";

export interface Content {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  channel_id: string;
  kind: ContentKind;
  status: ContentStatus;
  title: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  persona: string | null;
  planned_at: string | null;
  published_url: string | null;
  external_id: string | null;
  lint_result: unknown[];
  metrics: Record<string, unknown>;
  owner_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContentFilters {
  status?: ContentStatus[];
  channelId?: string;
  campaignId?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

const VALID_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  idea: ["draft", "rejected"],
  draft: ["in_review", "rejected"],
  in_review: ["approved", "rejected"],
  approved: ["scheduled", "rejected"],
  scheduled: ["published", "rejected"],
  published: [],
  rejected: ["draft"],
};

export function isValidTransition(from: ContentStatus, to: ContentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function getContent(
  workspaceId: string,
  filters?: ContentFilters
): Promise<Content[]> {
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("content")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (filters?.status?.length) {
    query = query.in("status", filters.status);
  }
  if (filters?.channelId) {
    query = query.eq("channel_id", filters.channelId);
  }
  if (filters?.campaignId) {
    query = query.eq("campaign_id", filters.campaignId);
  }
  if (filters?.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  }
  if (filters?.dateFrom) {
    query = query.gte("planned_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("planned_at", filters.dateTo);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,body.ilike.%${filters.search}%,hook.ilike.%${filters.search}%`
    );
  }

  query = query.order("planned_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data } = await query;
  return (data ?? []) as Content[];
}

export async function getContentById(workspaceId: string, id: string): Promise<Content | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("content")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();
  return data as Content | null;
}

export async function createContent(
  workspaceId: string,
  input: Partial<Content> & { created_by: string }
): Promise<Content> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("content")
    .insert({
      workspace_id: workspaceId,
      status: "idea",
      ...input,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Content;
}

export async function updateContent(
  workspaceId: string,
  id: string,
  input: Partial<Content>
): Promise<Content> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("content")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Content;
}

export async function updateContentStatus(
  workspaceId: string,
  id: string,
  newStatus: ContentStatus,
  actor: string
): Promise<Content> {
  const current = await getContentById(workspaceId, id);
  if (!current) throw new Error("Content not found");

  if (!isValidTransition(current.status, newStatus)) {
    throw new Error(
      `Invalid status transition: ${current.status} → ${newStatus}`
    );
  }

  const updated = await updateContent(workspaceId, id, { status: newStatus });

  await logAudit({
    workspace_id: workspaceId,
    actor,
    action: "content.status_change",
    entity: "content",
    entity_id: id,
    before: { status: current.status },
    after: { status: newStatus },
  });

  return updated;
}

export async function deleteContent(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("content")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
