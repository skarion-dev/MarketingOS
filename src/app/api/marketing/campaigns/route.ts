import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  getCampaigns,
  createCampaign,
} from "@/server/repositories/marketingRepository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const campaigns = await getCampaigns(auth.userId);
    return NextResponse.json(campaigns);
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
    const { name, channel_id, status, start_date, end_date, goals } = body;
    if (!name || !channel_id) {
      return NextResponse.json(
        { error: "name and channel_id are required" },
        { status: 400 }
      );
    }
    const campaign = await createCampaign(auth.userId, {
      name,
      channel_id,
      status,
      start_date,
      end_date,
      goals,
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
