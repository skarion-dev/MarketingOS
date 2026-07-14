import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getProspects, getCampaigns, getContentList } from "@/server/repositories/marketingRepository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "prospects";

    let headers = "";
    let rows: string[] = [];

    if (type === "prospects") {
      const data = await getProspects(auth.userId);
      headers = "first_name,last_name,email,company,title,linkedin_url,source,stage,status";
      rows = data.map((p) =>
        [p.first_name, p.last_name, p.email, p.company, p.title, p.linkedin_url, p.source, p.stage, p.status]
          .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
    } else if (type === "campaigns") {
      const data = await getCampaigns(auth.userId);
      headers = "name,status,start_date,end_date,goals";
      rows = data.map((c) =>
        [c.name, c.status, c.start_date, c.end_date, c.goals]
          .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
    } else if (type === "content") {
      const data = await getContentList(auth.userId);
      headers = "kind,subject,body,status";
      rows = data.map((c) =>
        [c.kind, c.subject, c.body, c.status]
          .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
    }

    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=marketing-${type}-export.csv`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
