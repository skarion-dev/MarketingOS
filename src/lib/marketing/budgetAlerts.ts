import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function checkBudgetAlerts(workspaceId: string): Promise<{
  alerts: { campaignId: string; campaignName: string; spentPercent: number }[];
}> {
  const supabase = createServiceSupabaseClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, ai_budget_cents")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .gt("ai_budget_cents", 0);

  const alerts: { campaignId: string; campaignName: string; spentPercent: number }[] = [];

  for (const campaign of campaigns ?? []) {
    const { count } = await supabase
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("entity", "content")
      .eq("entity_id", campaign.id);

    const spentCents = count ?? 0;
    const percent = campaign.ai_budget_cents > 0
      ? (spentCents / campaign.ai_budget_cents) * 100
      : 0;

    if (percent >= 80) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        spentPercent: Math.round(percent),
      });
    }
  }

  return { alerts };
}
