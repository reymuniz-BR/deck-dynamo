import { supabase } from "@/integrations/supabase/client";
import type { Deck, DeckSource, Slide } from "./deck-types";

export async function getMyWorkspaceId() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No workspace found for this account");
  return { workspaceId: data.workspace_id, userId };
}

export async function listDecks(): Promise<Deck[]> {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Deck[];
}

export async function getDeck(deckId: string): Promise<Deck> {
  const { data, error } = await supabase.from("decks").select("*").eq("id", deckId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Deck not found");
  return data as unknown as Deck;
}

export async function getSlides(deckId: string): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("deck_id", deckId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Slide[]).map((slide) => ({
    ...slide,
    bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
  }));
}

export async function getSources(deckId: string): Promise<DeckSource[]> {
  const { data, error } = await supabase
    .from("deck_sources")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DeckSource[];
}

export async function addSource(input: {
  deckId: string;
  workspaceId: string;
  userId: string;
  kind: "note" | "file" | "reference";
  label: string;
  relevance: string;
  whyRelevant?: string | undefined;
  extractedText?: string | undefined;
  filePath?: string | null | undefined;
  brand?: unknown;
}) {
  const { error } = await supabase.from("deck_sources").insert({
    deck_id: input.deckId,
    workspace_id: input.workspaceId,
    created_by: input.userId,
    kind: input.kind,
    label: input.label,
    relevance: input.relevance,
    why_relevant: input.whyRelevant ?? null,
    extracted_text: input.extractedText ?? null,
    file_path: input.filePath ?? null,
    brand: (input.brand ?? null) as never,
  });
  if (error) throw new Error(error.message);
}

export async function uploadSourceFile(workspaceId: string, deckId: string, file: File) {
  const path = `${workspaceId}/${deckId}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("deck-sources").upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}

export async function setDeckBrand(deckId: string, brand: unknown) {
  const { error } = await supabase
    .from("decks")
    .update({ brand: brand as never })
    .eq("id", deckId);
  if (error) throw new Error(error.message);
}
