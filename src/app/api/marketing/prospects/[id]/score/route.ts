import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getProspect } from "@/server/repositories/marketingRepository";
import { scoreProspect } from "@/lib/marketing/scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prospect = await getProspect(params.id, auth.userId);
    if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = await scoreProspect({
      company: prospect.company ?? undefined,
      title: prospect.title ?? undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
