import { supabase } from "@/integrations/supabase/client";

export type Tache = {
  id: string;
  title: string;
  tags: string[];
  completed: boolean;
  created_at: string;
};

export const TAGS = [
  { id: "design", label: "Design" },
  { id: "ingenierie", label: "Ingénierie" },
  { id: "urgent", label: "Urgent" },
  { id: "perso", label: "Perso" },
] as const;

export type TagId = (typeof TAGS)[number]["id"];

export function libelleTag(id: string) {
  return TAGS.find((t) => t.id === id)?.label ?? id;
}

export async function listerTaches(): Promise<Tache[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, tags, completed, created_at")
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tache[];
}

export async function creerTache(input: { title: string; tags: string[] }) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ title: input.title, tags: input.tags })
    .select("id, title, tags, completed, created_at")
    .single();
  if (error) throw error;
  return data as Tache;
}

export async function basculerTache(input: { id: string; completed: boolean }) {
  const { error } = await supabase
    .from("tasks")
    .update({ completed: input.completed })
    .eq("id", input.id);
  if (error) throw error;
}

export async function modifierTitre(input: { id: string; title: string }) {
  const { error } = await supabase.from("tasks").update({ title: input.title }).eq("id", input.id);
  if (error) throw error;
}

export async function supprimerTache(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
