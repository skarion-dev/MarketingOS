import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getTasks, createTask } from "@/server/repositories/marketingRepository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getTasks(auth.userId));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
    return NextResponse.json(await createTask(auth.userId, body), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
