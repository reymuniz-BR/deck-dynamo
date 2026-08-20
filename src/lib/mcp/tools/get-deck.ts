import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_deck",
  title: "Get deck",
  description:
    "Read one deck in full: brief, outline, every slide (title, subtitle, bullets, speaker notes) and its source material labels.",
  inputSchema: { deckId: z.string().uuid().describe("The deck's id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ deckId }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data: deck, error } = await supabase
      .from("decks")
      .select("id, title, client_name, project_brief, stage, outline, google_slides_url")
      .eq("id", deckId)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!deck)
      return {
        content: [{ type: "text", text: "Deck not found, or you do not have access to it." }],
        isError: true,
      };

    const [{ data: slides }, { data: sources }] = await Promise.all([
      supabase
        .from("slides")
        .select("id, position, title, subtitle, bullets, speaker_notes, layout")
        .eq("deck_id", deckId)
        .order("position", { ascending: true }),
      supabase
        .from("deck_sources")
        .select("id, kind, label, relevance, why_relevant")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: true }),
    ]);

    const payload = { deck, slides: slides ?? [], sources: sources ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
