import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  generateDeckOutline,
  generateDeckSlides,
  regenerateOneSlide,
} from "./deck-generation.server";

export const proposeOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ deckId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => generateDeckOutline(context.supabase, data.deckId));

export const generateSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ deckId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => generateDeckSlides(context.supabase, data.deckId));

export const regenerateSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slideId: z.string().uuid(), nudge: z.string().max(2000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) =>
    regenerateOneSlide(context.supabase, data.slideId, data.nudge ?? ""),
  );
