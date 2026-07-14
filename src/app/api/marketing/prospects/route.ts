import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getProspects, createProspect } from "@/server/repositories/marketingRepository";
import { generateDedupeKey } from "@/lib/marketing/dedupe";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const prospects = await getProspects(auth.userId);
    return NextResponse.json(prospects);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const dedupeKey = body.dedupe_key ?? generateDedupeKey(body);
    const prospect = await createProspect(auth.userId, { ...body, dedupe_key: dedupeKey });
    return NextResponse.json(prospect, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
