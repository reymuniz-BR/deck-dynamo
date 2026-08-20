import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_decks",
  title: "List decks",
  description:
    "List the signed-in user's business development decks, newest first, with title, client, stage and slide count.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("How many decks to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("decks")
      .select("id, title, client_name, stage, updated_at, slides(count)")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const decks = (data ?? []).map((deck: Record<string, unknown>) => ({
      id: deck["id"],
      title: deck["title"],
      client: deck["client_name"],
      stage: deck["stage"],
      updatedAt: deck["updated_at"],
      slideCount: (deck["slides"] as { count: number }[] | null)?.[0]?.count ?? 0,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(decks, null, 2) }],
      structuredContent: { decks },
    };
  },
});
