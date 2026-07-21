import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { handoffToTalentOS } from "@/lib/integrations/talentos";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("leads")
    .update(body)
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "agreement_signed") {
    await handoffToTalentOS({
      name: data.name ?? "",
      email: data.email ?? "",
      linkedinUrl: data.linkedin_url ?? "",
      degree: data.degree ?? "",
      school: data.school ?? "",
      authorization: data.authorization ?? "",
      source: "MarketingOS",
      notes: data.notes ?? "",
    });
  }

  if (body.source_content_id) {
    await supabase.from("touchpoints").insert({
      workspace_id: ctx.workspaceId,
      content_id: body.source_content_id,
      lead_id: params.id,
      kind: body.status === "agreement_signed" ? "agreement_signed" : "lead_updated",
    });
  }

  return NextResponse.json(data);
}
