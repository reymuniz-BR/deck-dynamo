import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_deck_note",
  title: "Add deck note",
  description:
    "Attach a written note or reference summary to a deck as source material the deck generator will draw on.",
  inputSchema: {
    deckId: z.string().uuid().describe("The deck to attach the note to."),
    label: z.string().trim().min(1).max(200).describe("Short label for the note."),
    text: z.string().trim().min(1).max(50000).describe("The note content."),
    relevance: z
      .enum(["content", "template", "both"])
      .default("content")
      .describe("Whether this informs the content, the template/structure, or both."),
    whyRelevant: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .describe("Why this material matters for this deck."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ deckId, label, text, relevance, whyRelevant }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id, workspace_id")
      .eq("id", deckId)
      .maybeSingle();

    if (deckError) return { content: [{ type: "text", text: deckError.message }], isError: true };
    if (!deck)
      return {
        content: [{ type: "text", text: "Deck not found, or you do not have access to it." }],
        isError: true,
      };

    const { data, error } = await supabase
      .from("deck_sources")
      .insert({
        deck_id: deckId,
        workspace_id: deck.workspace_id,
        created_by: ctx.getUserId(),
        kind: "note",
        label,
        relevance: relevance ?? "content",
        why_relevant: whyRelevant ?? null,
        extracted_text: text,
      })
      .select("id, label, relevance")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { source: data },
    };
  },
});
