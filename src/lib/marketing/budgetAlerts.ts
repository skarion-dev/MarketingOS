import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function checkBudgetAlerts(userId: string): Promise<{ campaignId: string; name: string; pct: number }[]> {
  const supabase = createServiceSupabaseClient();
  const { data: campaigns } = await supabase
    .from("marketing_campaigns")
    .select("id, name, monthly_ai_budget_cents, ai_spend_this_month_cents")
    .eq("user_id", userId)
    .gt("monthly_ai_budget_cents", 0);

  if (!campaigns) return [];

  return campaigns
    .filter((c) => {
      const budget = c.monthly_ai_budget_cents ?? 0;
      const spent = c.ai_spend_this_month_cents ?? 0;
      return budget > 0 && spent / budget >= 0.8;
    })
    .map((c) => ({
      campaignId: c.id,
      name: c.name,
      pct: Math.round(((c.ai_spend_this_month_cents ?? 0) / (c.monthly_ai_budget_cents ?? 1)) * 100),
    }));
}
