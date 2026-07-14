import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getOpportunities, createOpportunity } from "@/server/repositories/marketingRepository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getOpportunities(auth.userId));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.prospect_id || !body.name) {
      return NextResponse.json({ error: "prospect_id and name required" }, { status: 400 });
    }
    return NextResponse.json(await createOpportunity(auth.userId, body), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
