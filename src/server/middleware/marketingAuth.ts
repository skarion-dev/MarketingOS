import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function createMarketingAuthMiddleware() {
  return async function marketingAuth(request: NextRequest) {
    const role = request.headers.get("x-marketing-role") ?? "viewer";

    if (request.method === "GET") return NextResponse.next();

    if (role === "viewer") {
      return NextResponse.json({ error: "Viewer role cannot modify" }, { status: 403 });
    }

    return NextResponse.next();
  };
}
