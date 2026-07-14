import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  getChannels,
  createChannel,
} from "@/server/repositories/marketingRepository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const channels = await getChannels(auth.userId);
    return NextResponse.json(channels);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name, type, description, is_active } = body;
    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }
    const channel = await createChannel(auth.userId, {
      name,
      type,
      description,
      is_active,
    });
    return NextResponse.json(channel, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
