import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceSupabaseClient();

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleLeads } = await supabase
    .from("leads")
    .select("id, workspace_id, name, owner_id")
    .in("status", ["new", "contacted"])
    .lte("created_at", threeDaysAgo);

  let created = 0;

  for (const lead of staleLeads ?? []) {
    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("kind", "followup")
      .in("status", ["open", "in_progress"])
      .limit(1);

    if (existing?.length) continue;

    await supabase.from("tasks").insert({
      workspace_id: lead.workspace_id,
      lead_id: lead.id,
      kind: "followup",
      title: `Follow up with ${lead.name ?? "lead"}`,
      priority: "medium",
      due_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      assignee_id: lead.owner_id,
    });

    created++;
  }

  return NextResponse.json({
    success: true,
    followups_created: created,
    timestamp: now.toISOString(),
  });
}
