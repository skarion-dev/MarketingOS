import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createProspect, findByDedupeKey } from "@/server/repositories/marketingRepository";
import { generateDedupeKey } from "@/lib/marketing/dedupe";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { rows } = await request.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "rows array is required" }, { status: 400 });
    }
    const results = { created: 0, skipped: 0, errors: 0 as number };
    for (const row of rows) {
      try {
        const dedupeKey = row.dedupe_key ?? generateDedupeKey(row);
        const existing = await findByDedupeKey(auth.userId, dedupeKey);
        if (existing) { results.skipped++; continue; }
        await createProspect(auth.userId, { ...row, dedupe_key: dedupeKey });
        results.created++;
      } catch { results.errors++; }
    }
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
