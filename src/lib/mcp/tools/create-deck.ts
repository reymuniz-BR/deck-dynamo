import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_deck",
  title: "Create deck",
  description:
    "Start a new business development deck in the user's workspace with a title, optional client name and project brief. Slide generation still happens in the app.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Deck title."),
    clientName: z.string().trim().max(200).optional().describe("Client or prospect name."),
    projectBrief: z
      .string()
      .trim()
      .max(10000)
      .optional()
      .describe("What the project is about, who it is for and what the deck must achieve."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, clientName, projectBrief }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError)
      return { content: [{ type: "text", text: membershipError.message }], isError: true };
    if (!membership)
      return {
        content: [{ type: "text", text: "No workspace found for this account." }],
        isError: true,
      };

    const { data, error } = await supabase
      .from("decks")
      .insert({
        workspace_id: membership.workspace_id,
        created_by: userId,
        title,
        client_name: clientName ?? null,
        project_brief: projectBrief ?? null,
      })
      .select("id, title, client_name, stage")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { deck: data },
    };
  },
});
