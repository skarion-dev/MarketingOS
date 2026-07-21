import { createServiceSupabaseClient } from "@/lib/supabase/server";

export interface AuditEntry {
  workspace_id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("audit_log").insert({
    workspace_id: entry.workspace_id,
    actor: entry.actor,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id ?? null,
    before: entry.before ? JSON.stringify(entry.before) : null,
    after: entry.after ? JSON.stringify(entry.after) : null,
  });

  if (error) {
    console.error("[audit] Failed to write audit log:", error);
  }
}

export async function getAuditLog(
  workspaceId: string,
  entity: string,
  entityId: string
) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("entity", entity)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[audit] Failed to read audit log:", error);
    return [];
  }
  return data ?? [];
}
