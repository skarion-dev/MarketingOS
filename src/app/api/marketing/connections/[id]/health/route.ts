import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = createServiceSupabaseClient();
  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*, channels(kind)")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { getPublisher } = await import("@/lib/publish/publisher");
    const { getSecretValue } = await import("@/server/repositories/secretRepository");

    const token = await getSecretValue(
      ctx.workspaceId,
      "oauth_token",
      `${connection.provider}-token`
    );

    if (!token) {
      return NextResponse.json({ status: "error", reason: "No token found" });
    }

    const publisher = getPublisher(connection.provider, token);
    const healthy = await publisher.healthCheck();

    await supabase
      .from("channel_connections")
      .update({
        status: healthy ? "connected" : "error",
        last_health_check: new Date().toISOString(),
      })
      .eq("id", params.id);

    return NextResponse.json({ status: healthy ? "connected" : "error", healthy });
  } catch (err: any) {
    return NextResponse.json({ status: "error", reason: err.message }, { status: 500 });
  }
}
