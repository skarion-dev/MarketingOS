import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function getCampaignBudget(campaignId: string): Promise<{
  budget_cents: number;
  spent_cents: number;
  remaining_cents: number;
}> {
  const supabase = createServiceSupabaseClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("ai_budget_cents")
    .eq("id", campaignId)
    .single();

  const budgetCents = campaign?.ai_budget_cents ?? 0;

  const { data: usage } = await supabase.rpc("get_campaign_ai_spend", {
    p_campaign_id: campaignId,
  });

  const spentCents = usage ?? 0;

  return {
    budget_cents: budgetCents,
    spent_cents: spentCents,
    remaining_cents: budgetCents - spentCents,
  };
}

export async function checkBudget(
  workspaceId: string,
  campaignId: string | null
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  if (!campaignId) return { allowed: true, remaining: 0 };

  const budget = await getCampaignBudget(campaignId);

  if (budget.budget_cents === 0) return { allowed: true, remaining: 0 };

  if (budget.remaining_cents <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: `Campaign AI budget exhausted (${budget.budget_cents} cents total, ${budget.spent_cents} spent)`,
    };
  }

  return { allowed: true, remaining: budget.remaining_cents };
}

export async function getWorkspaceAiSpend(workspaceId: string): Promise<{
  total_cents: number;
  byModel: Record<string, number>;
}> {
  const supabase = createServiceSupabaseClient();

  const { data } = await supabase
    .from("ai_usage_log")
    .select("model, cost_cents")
    .eq("workspace_id", workspaceId);

  const byModel: Record<string, number> = {};
  let total = 0;

  for (const row of data ?? []) {
    byModel[row.model] = (byModel[row.model] ?? 0) + Number(row.cost_cents);
    total += Number(row.cost_cents);
  }

  return { total_cents: total, byModel };
}
