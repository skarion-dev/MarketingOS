import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = createServiceSupabaseClient();

  const { data: content } = await supabase
    .from("content")
    .select("status, kind, updated_at")
    .eq("workspace_id", ctx.workspaceId);

  const { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("workspace_id", ctx.workspaceId);

  const socialPosts = content?.filter((c) =>
    ["post", "dm"].includes(c.kind) && c.status !== "idea"
  ).length ?? 0;

  const emailsSent = content?.filter((c) => c.kind === "email").length ?? 0;
  const dmsSent = content?.filter((c) => c.kind === "dm").length ?? 0;
  const published = content?.filter((c) => c.status === "published").length ?? 0;
  const totalContent = content?.length ?? 0;

  return NextResponse.json({
    totalContent,
    published,
    socialPosts,
    emailsSent,
    dmsSent,
    leads: leads?.length ?? 0,
    callsFromSocial: 0,
    callsFromEmail: 0,
    callsFromDMs: 0,
  });
}
