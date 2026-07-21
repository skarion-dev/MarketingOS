import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET ?? "dev-secret";

function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac("sha256", WEBHOOK_SECRET);
  const digest = hmac.update(body).digest("hex");
  return signature === digest;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-marketingos-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(body);
    console.log(`[webhook] Received: ${event.type}`, event);

    switch (event.type) {
      case "content.published":
        console.log(`[webhook] Content published: ${event.data?.contentId}`);
        break;
      case "lead.warm":
        console.log(`[webhook] Lead warmed: ${event.data?.leadId}`);
        break;
      case "budget.warning":
        console.log(`[webhook] Budget warning: ${event.data?.message}`);
        break;
      default:
        console.log(`[webhook] Unknown event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
