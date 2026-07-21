import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = createServiceSupabaseClient();

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const temperature = url.searchParams.get("temperature");

  let query = supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (temperature) query = query.eq("temperature", temperature);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("leads")
    .insert({ workspace_id: ctx.workspaceId, ...body })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.source_content_id) {
    await supabase.from("touchpoints").insert({
      workspace_id: ctx.workspaceId,
      content_id: body.source_content_id,
      lead_id: data.id,
      kind: "lead_created",
    });
  }

  return NextResponse.json(data, { status: 201 });
}
