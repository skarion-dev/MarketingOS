import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createContent } from "./contentRepository";
import type { Content } from "./contentRepository";

export interface Idea {
  id: string;
  workspace_id: string;
  title: string;
  angle: string | null;
  source: string | null;
  persona: string | null;
  priority: number;
  status: "new" | "accepted" | "used" | "archived";
  converted_content_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getIdeas(workspaceId: string): Promise<Idea[]> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("priority", { ascending: false });
  return (data ?? []) as Idea[];
}

export async function getIdea(workspaceId: string, id: string): Promise<Idea | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();
  return data as Idea | null;
}

export async function createIdea(
  workspaceId: string,
  input: Partial<Idea>
): Promise<Idea> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ideas")
    .insert({ workspace_id: workspaceId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Idea;
}

export async function updateIdea(
  workspaceId: string,
  id: string,
  input: Partial<Idea>
): Promise<Idea> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ideas")
    .update(input)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Idea;
}

export async function deleteIdea(workspaceId: string, id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("ideas")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function convertToContent(
  workspaceId: string,
  ideaId: string,
  channelId: string,
  userId: string
): Promise<Content> {
  const idea = await getIdea(workspaceId, ideaId);
  if (!idea) throw new Error("Idea not found");
  if (idea.status === "used") throw new Error("Idea already converted");

  const content = await createContent(workspaceId, {
    title: idea.title,
    hook: idea.angle ?? undefined,
    channel_id: channelId,
    persona: idea.persona ?? undefined,
    created_by: userId,
  });

  await updateIdea(workspaceId, ideaId, {
    status: "used",
    converted_content_id: content.id,
  });

  return content;
}
