import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { createContent } from "@/server/repositories/marketing/contentRepository";

export async function POST(request: NextRequest) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  try {
    const text = await request.text();

    if (!text.trim()) {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 });
    }

    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

    const imported: unknown[] = [];

    for (const row of rows) {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h.toLowerCase().trim()] = row[i]?.trim() ?? "";
      });

      const title = record.title || record.subject || record.name || "";
      const body = record.body || "";
      const kind = record.kind || record.type || "post";
      const channelId = record.channel_id || record.channelid || "";

      if (!title && !body) continue;
      if (!channelId && !dryRun) continue;

      if (!dryRun) {
        try {
          const content = await createContent(ctx.workspaceId, {
            title,
            body,
            hook: record.hook || record.angle || undefined,
            kind: kind as any,
            channel_id: channelId,
            persona: record.persona || undefined,
            created_by: ctx.userId,
          });
          imported.push(content);
        } catch (err) {
          imported.push({ error: `Failed to import row: ${title}`, reason: String(err) });
        }
      } else {
        imported.push({ title, body, kind, channelId });
      }
    }

    return NextResponse.json({ imported, count: imported.length, dryRun });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
