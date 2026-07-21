import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { getContent, ContentFilters } from "@/server/repositories/marketing/contentRepository";

export async function GET(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.split(",") as any;
  const channelId = url.searchParams.get("channelId") ?? undefined;
  const campaignId = url.searchParams.get("campaignId") ?? undefined;

  const filters: ContentFilters = {
    status,
    channelId,
    campaignId,
  };

  const rows = await getContent(ctx.workspaceId, filters);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to export" }, { status: 404 });
  }

  const headers = ["Title", "Hook", "Body", "Kind", "Status", "Persona", "Planned At", "Created At"];

  const csvRows = [headers.map((h) => `"${h}"`).join(",")];

  for (const row of rows) {
    csvRows.push(
      [
        row.title ?? "",
        row.hook ?? "",
        row.body ?? "",
        row.kind,
        row.status,
        row.persona ?? "",
        row.planned_at ?? "",
        row.created_at,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  }

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="marketingos-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
