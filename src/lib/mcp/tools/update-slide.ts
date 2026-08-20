import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_slide",
  title: "Update slide",
  description:
    "Edit the copy on one slide: title, subtitle, bullets or speaker notes. Only the fields you pass are changed.",
  inputSchema: {
    slideId: z.string().uuid().describe("The slide's id (from get_deck)."),
    title: z.string().trim().max(200).optional(),
    subtitle: z.string().trim().max(300).optional(),
    bullets: z.array(z.string().trim().max(300)).max(8).optional(),
    speakerNotes: z.string().trim().max(4000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ slideId, title, subtitle, bullets, speakerNotes }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch["title"] = title;
    if (subtitle !== undefined) patch["subtitle"] = subtitle;
    if (bullets !== undefined) patch["bullets"] = bullets;
    if (speakerNotes !== undefined) patch["speaker_notes"] = speakerNotes;

    if (Object.keys(patch).length === 0)
      return {
        content: [{ type: "text", text: "Nothing to update — pass at least one field." }],
        isError: true,
      };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("slides")
      .update(patch)
      .eq("id", slideId)
      .select("id, position, title, subtitle, bullets, speaker_notes")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: "Slide not found, or you do not have access to it." }],
        isError: true,
      };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { slide: data },
    };
  },
});
