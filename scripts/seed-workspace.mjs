import { put, list, del } from "@vercel/blob";
import { readFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

async function main() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("[seed] Seeding Skarion workspace...");

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    console.error("[seed] Could not create Supabase client");
    process.exit(1);
  }

  let workspaceId = "";

  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", "skarion")
    .single();

  if (existing) {
    workspaceId = existing.id;
    console.log(`[seed] Workspace 'skarion' already exists: ${workspaceId}`);
  } else {
    const { data: ws, error } = await supabase
      .from("workspaces")
      .insert({ name: "Skarion", slug: "skarion", plan: "free" })
      .select()
      .single();

    if (error) throw new Error(`Failed to create workspace: ${error.message}`);
    workspaceId = ws.id;
    console.log(`[seed] Created workspace 'skarion': ${workspaceId}`);
  }

  const { data: supers } = await supabase.auth.admin.listUsers();
  const skarionUsers = supers?.users ?? [];

  console.log(`[seed] Found ${skarionUsers.length} users in Supabase`);

  for (const user of skarionUsers) {
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      console.log(`[seed] User ${user.email} already a member, skipping`);
      continue;
    }

    const role = user.id === skarionUsers[0]?.id ? "owner" : "editor";

    const { error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role,
      });

    if (error) {
      console.error(`[seed] Failed to add ${user.email}: ${error.message}`);
    } else {
      console.log(`[seed] Added ${user.email} as ${role}`);
    }
  }

  const settings = {
    fee_language_fallback:
      "There is no upfront fee. We only charge you if you successfully land a role through Skarion's support.",
    posting_cadence: "daily",
    mentionable_employers: "",
    followup_cadence: "72h",
  };

  for (const [key, value] of Object.entries(settings)) {
    const { error } = await supabase
      .from("workspace_settings")
      .upsert(
        { workspace_id: workspaceId, key, value },
        { onConflict: "workspace_id,key" }
      );

    if (error) {
      console.error(`[seed] Failed to set ${key}: ${error.message}`);
    } else {
      console.log(`[seed] Set ${key}=${value}`);
    }
  }

  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal:", err);
  process.exit(1);
});
