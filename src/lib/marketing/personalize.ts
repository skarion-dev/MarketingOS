import { getProspect } from "@/server/repositories/marketingRepository";

export async function buildPersonalizationContext(
  userId: string,
  prospectId?: string
): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {};

  if (prospectId) {
    const p = await getProspect(prospectId, userId);
    if (p) {
      if (p.first_name) ctx.name = `${p.first_name} ${p.last_name ?? ""}`.trim();
      if (p.company) ctx.company = p.company;
      if (p.title) ctx.role = p.title;
      if (p.notes) ctx.context = p.notes;
    }
  }

  return ctx;
}
