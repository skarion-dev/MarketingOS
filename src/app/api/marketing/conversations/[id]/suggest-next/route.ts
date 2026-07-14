import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getConversation } from "@/server/repositories/marketingRepository";
import { suggestNextAction } from "@/lib/marketing/nextAction";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const convo = await getConversation(params.id, auth.userId);
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await suggestNextAction(
      `Subject: ${convo.subject || "N/A"}\nStatus: ${convo.status}\nLast message: ${convo.last_message_at || "N/A"}`
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
