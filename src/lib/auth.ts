import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function getAuthFromRequest(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { userId: user.id, email: user.email };
}
