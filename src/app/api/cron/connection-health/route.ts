import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getPublisher } from "@/lib/publish/publisher";
import { getSecretValue } from "@/server/repositories/secretRepository";

export async function GET() {
  const supabase = createServiceSupabaseClient();

  const { data: connections } = await supabase
    .from("channel_connections")
    .select("*")
    .not("status", "eq", "disconnected")
    .not("status", "eq", "error")
    .limit(20);

  if (!connections?.length) {
    return NextResponse.json({ success: true, checked: 0 });
  }

  let healthy = 0;
  let failed = 0;

  for (const connection of connections) {
    try {
      const { data: result } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("workspace_id", connection.workspace_id)
        .eq("user_id", "system")
        .maybeSingle();

      const token = await getSecretValue(
        connection.workspace_id,
        "oauth_token",
        `${connection.provider}-token`
      );

      if (!token) {
        await supabase
          .from("channel_connections")
          .update({ status: "error", last_health_check: new Date().toISOString() })
          .eq("id", connection.id);
        failed++;
        continue;
      }

      const publisher = getPublisher(connection.provider, token);
      const ok = await publisher.healthCheck();

      await supabase
        .from("channel_connections")
        .update({
          status: ok ? "connected" : "error",
          last_health_check: new Date().toISOString(),
        })
        .eq("id", connection.id);

      if (ok) healthy++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ success: true, checked: connections.length, healthy, failed });
}
