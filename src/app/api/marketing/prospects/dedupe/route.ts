import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { findByDedupeKey } from "@/server/repositories/marketingRepository";
import { generateDedupeKey } from "@/lib/marketing/dedupe";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const dedupeKey = body.dedupe_key ?? generateDedupeKey(body);
    const existing = await findByDedupeKey(auth.userId, dedupeKey);
    return NextResponse.json({
      dedupe_key: dedupeKey,
      exists: !!existing,
      prospect: existing ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
