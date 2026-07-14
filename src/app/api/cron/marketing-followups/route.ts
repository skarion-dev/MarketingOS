import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createTask } from "@/server/repositories/marketingRepository";

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    const now = new Date();
    const staleDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleConversations } = await supabase
      .from("marketing_conversations")
      .select("id, user_id, prospect_id")
      .eq("status", "active")
      .or(`last_message_at.is.null,last_message_at.lt.${staleDate}`);

    if (!staleConversations?.length) {
      return NextResponse.json({ tasksCreated: 0 });
    }

    let created = 0;
    for (const convo of staleConversations) {
      try {
        await createTask(convo.user_id, {
          title: "Follow up on stale conversation",
          prospect_id: convo.prospect_id,
          priority: "high",
        });
        created++;
      } catch {
        // skip individual failures
      }
    }

    return NextResponse.json({ tasksCreated: created });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
