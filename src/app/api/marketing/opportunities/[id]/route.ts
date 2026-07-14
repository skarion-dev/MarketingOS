import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/server/repositories/marketingRepository";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const o = await getOpportunity(params.id, auth.userId);
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(o);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const o = await updateOpportunity(params.id, auth.userId, body);
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(o);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ok = await deleteOpportunity(params.id, auth.userId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
