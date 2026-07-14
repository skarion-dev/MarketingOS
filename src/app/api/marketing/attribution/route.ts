import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getAttributionReport, getFirstTouchAttribution, getLastTouchAttribution } from "@/lib/marketing/attribution";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const prospectId = searchParams.get("prospect_id");

    if (prospectId) {
      const [first, last] = await Promise.all([
        getFirstTouchAttribution(auth.userId, prospectId),
        getLastTouchAttribution(auth.userId, prospectId),
      ]);
      return NextResponse.json({ firstTouch: first, lastTouch: last });
    }

    const report = await getAttributionReport(auth.userId);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
