import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createLovableResponsesProvider, DECK_MODEL } from "./ai-gateway.server";
import {
  SYSTEM_PROMPT,
  buildSourceContext,
  outlinePrompt,
  slidesPrompt,
  regeneratePrompt,
  type OutlineItem,
  type SourceRow,
} from "./deck-prompt";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = SupabaseClient<any, any, any>;

// Keep schemas permissive: models routinely omit optional-ish fields, so every
// non-essential field is nullable/defaulted instead of strictly required.
const outlineSchema = z.object({
  slides: z.array(
    z.object({
      title: z.string(),
      purpose: z.string().nullable(),
    }),
  ),
});

const slideSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  bullets: z.array(z.string()),
  speakerNotes: z.string(),
  layout: z.string(),
});

const slidesSchema = z.object({ slides: z.array(slideSchema) });

function model() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project yet.");
  return createLovableAiGatewayProvider(key)(DECK_MODEL);
}

function extractJson(text: string | undefined): unknown {
  if (!text) return undefined;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.search(/[[{]/);
  if (start === -1) return undefined;
  const slice = candidate.slice(start);
  for (let end = slice.length; end > 0; end--) {
    const chunk = slice.slice(0, end);
    try {
      return JSON.parse(chunk);
    } catch {
      /* keep trimming */
    }
  }
  return undefined;
}

/**
 * Runs a structured generation and degrades gracefully: if the model output
 * fails schema validation, we re-parse the raw text and coerce it once more
 * before surfacing a readable error instead of crashing the feature.
 */
async function generateStructured<T extends z.ZodTypeAny>(
  schema: T,
  args: { system: string; prompt: string; arrayKey?: string },
): Promise<z.infer<T>> {
  try {
    const result = streamText({
      model: model(),
      system: args.system,
      prompt: args.prompt,
      output: Output.object({ schema }),
    });
    return (await result.output) as z.infer<T>;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const raw = extractJson(error.text);
      // Models sometimes answer with a bare array instead of the wrapper object.
      const candidate =
        Array.isArray(raw) && args.arrayKey ? { [args.arrayKey]: raw } : raw;
      const parsed = schema.safeParse(candidate);
      if (parsed.success) return parsed.data as z.infer<T>;
    }
    throw new Error(
      "The AI returned an unusable response. Please try again — if it keeps happening, simplify the brief or sources.",
    );
  }
}

async function loadDeck(supabase: Db, deckId: string) {
  const { data: deck, error } = await supabase
    .from("decks")
    .select("id, workspace_id, title, client_name, project_brief, outline")
    .eq("id", deckId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!deck) throw new Error("Deck not found");

  const { data: sources, error: sourceError } = await supabase
    .from("deck_sources")
    .select("label, kind, relevance, why_relevant, extracted_text")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  if (sourceError) throw new Error(sourceError.message);

  return { deck, sourceContext: buildSourceContext((sources ?? []) as SourceRow[]) };
}

export async function generateDeckOutline(supabase: Db, deckId: string) {
  const { deck, sourceContext } = await loadDeck(supabase, deckId);

  const output = await generateStructured(outlineSchema, {
    system: SYSTEM_PROMPT,
    prompt: outlinePrompt({
      brief: deck.project_brief ?? "",
      clientName: deck.client_name,
      sourceContext,
    }),
    arrayKey: "slides",
  });

  const outline: OutlineItem[] = output.slides
    .slice(0, 20)
    .map((item) => ({ title: item.title, purpose: item.purpose ?? "" }));
  if (outline.length === 0) throw new Error("The AI did not return any slides. Please try again.");

  const { error } = await supabase
    .from("decks")
    .update({ outline, stage: "outline" })
    .eq("id", deckId);
  if (error) throw new Error(error.message);

  return { outline };
}

export async function generateDeckSlides(supabase: Db, deckId: string) {
  const { deck, sourceContext } = await loadDeck(supabase, deckId);
  const outline = (deck.outline ?? []) as OutlineItem[];
  if (outline.length === 0) throw new Error("Confirm an outline before generating slides.");

  await supabase.from("decks").update({ stage: "generating" }).eq("id", deckId);

  try {
    const output = await generateStructured(slidesSchema, {
      system: SYSTEM_PROMPT,
      prompt: slidesPrompt({
        brief: deck.project_brief ?? "",
        clientName: deck.client_name,
        sourceContext,
        outline,
      }),
      arrayKey: "slides",
    });

    if (output.slides.length === 0) {
      throw new Error("The AI did not return any slides. Please try again.");
    }

    await supabase.from("slides").delete().eq("deck_id", deckId);

    const rows = output.slides.map((slide, index) => ({
      deck_id: deckId,
      workspace_id: deck.workspace_id,
      position: index,
      title: slide.title.slice(0, 200),
      subtitle: slide.subtitle?.slice(0, 300) ?? null,
      bullets: (slide.bullets ?? []).slice(0, 8).map((b) => b.slice(0, 300)),
      speaker_notes: slide.speakerNotes ?? "",
      layout: slide.layout || "bullets",
    }));

    const { error } = await supabase.from("slides").insert(rows);
    if (error) throw new Error(error.message);

    await supabase.from("decks").update({ stage: "ready" }).eq("id", deckId);
    return { count: rows.length };
  } catch (error) {
    await supabase.from("decks").update({ stage: "outline" }).eq("id", deckId);
    throw error;
  }
}

export async function regenerateOneSlide(supabase: Db, slideId: string, nudge: string) {
  const { data: slide, error: slideError } = await supabase
    .from("slides")
    .select("id, deck_id, title")
    .eq("id", slideId)
    .maybeSingle();
  if (slideError) throw new Error(slideError.message);
  if (!slide) throw new Error("Slide not found");

  const { deck, sourceContext } = await loadDeck(supabase, slide.deck_id);
  const outline = (deck.outline ?? []) as OutlineItem[];
  const match = outline.find((item) => item.title === slide.title);

  const { data: others } = await supabase
    .from("slides")
    .select("title")
    .eq("deck_id", slide.deck_id)
    .neq("id", slideId)
    .order("position");

  const output = await generateStructured(slideSchema, {
    system: SYSTEM_PROMPT,
    prompt: regeneratePrompt({
      brief: deck.project_brief ?? "",
      clientName: deck.client_name,
      sourceContext,
      slide: { title: slide.title, purpose: match?.purpose ?? "" },
      neighbours: (others ?? []).map((o: { title: string }) => o.title),
      nudge,
    }),
  });

  const { error } = await supabase
    .from("slides")
    .update({
      title: output.title.slice(0, 200),
      subtitle: output.subtitle?.slice(0, 300) ?? null,
      bullets: (output.bullets ?? []).slice(0, 8).map((b) => b.slice(0, 300)),
      speaker_notes: output.speakerNotes ?? "",
      layout: output.layout || "bullets",
    })
    .eq("id", slideId);
  if (error) throw new Error(error.message);

  return { ok: true };
}
