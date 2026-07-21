import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setManySettings } from "@/server/repositories/settingsRepository";
import { createWorkspaceAuthMiddleware } from "@/server/middleware/requireRole";
import { logAudit } from "@/server/services/audit";

const auth = createWorkspaceAuthMiddleware(["owner", "admin"]);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth(request, { params });
  if (authResult.status !== 200) return authResult;

  const workspaceId = params.id;
  const settings = await getAllSettings(workspaceId);
  return NextResponse.json(settings);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth(request, { params });
  if (authResult.status !== 200) return authResult;

  const workspaceId = params.id;
  const body = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a key/value object" },
      { status: 400 }
    );
  }

  const previous = await getAllSettings(workspaceId);
  await setManySettings(workspaceId, body);

  const actor = request.headers.get("x-user-id") ?? "unknown";
  await logAudit({
    workspace_id: workspaceId,
    actor,
    action: "settings.update",
    entity: "workspace_settings",
    before: previous as Record<string, unknown>,
    after: body as Record<string, unknown>,
  });

  return NextResponse.json({ success: true });
}
