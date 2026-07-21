import { NextRequest, NextResponse } from "next/server";
import { processPublishBatch } from "@/server/services/publishService";

export async function GET() {
  try {
    const result = await processPublishBatch(10);
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Publish worker failed: ${err.message}` },
      { status: 500 }
    );
  }
}
