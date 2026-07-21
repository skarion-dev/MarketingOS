import { NextRequest, NextResponse } from "next/server";
import { updateContentStatus, ContentStatus } from "@/server/repositories/marketing/contentRepository";
import { resolveWorkspaceFromHeaders } from "@/server/api/workspaceContext";
import { logAudit } from "@/server/services/audit";

const VALID_STATUSES: ContentStatus[] = [
  "idea", "draft", "in_review", "approved", "scheduled", "published", "rejected",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveWorkspaceFromHeaders(request.headers);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!["owner", "admin", "editor"].includes(ctx.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json();
  const newStatus = body.status as string;

  if (!VALID_STATUSES.includes(newStatus as ContentStatus)) {
    return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
  }

  try {
    const content = await updateContentStatus(
      ctx.workspaceId,
      params.id,
      newStatus as ContentStatus,
      ctx.userId
    );
    return NextResponse.json(content);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
