import { SLIDE_LAYOUTS } from "./slide-layouts";

export type SourceRow = {
  label: string;
  kind: string;
  relevance: string;
  why_relevant: string | null;
  extracted_text: string | null;
};

export type OutlineItem = { title: string; purpose: string };

const PER_SOURCE_LIMIT = 14000;
const TOTAL_LIMIT = 90000;

function clip(text: string | null | undefined, limit: number) {
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit)}\n[...truncated]` : text;
}

export function buildSourceContext(sources: SourceRow[]) {
  const blocks: string[] = [];
  let used = 0;

  for (const source of sources) {
    const body = clip(source.extracted_text, PER_SOURCE_LIMIT);
    const block = [
      `--- SOURCE: ${source.label}`,
      `type: ${source.kind}`,
      `relevant for: ${source.relevance}`,
      source.why_relevant ? `why the user shared it: ${source.why_relevant}` : "",
      body ? `content:\n${body}` : "content: (no text extracted)",
    ]
      .filter(Boolean)
      .join("\n");

    if (used + block.length > TOTAL_LIMIT) break;
    used += block.length;
    blocks.push(block);
  }

  return blocks.join("\n\n");
}

export const SYSTEM_PROMPT = `You are a senior business development lead who writes client-facing pitch decks.

Rules you never break:
- Use only facts present in the supplied sources or project brief. Never invent metrics, client names, case-study results, dates or quotes.
- Where a real figure is clearly needed but unavailable, write a visible placeholder like [ADD Q3 REVENUE] instead of guessing.
- Match the vocabulary, tone and structure of the sources the user marked as template/structure references.
- Slide copy is punchy and spoken-word ready: short bullets, no filler, no marketing fluff.
- Write every title and subtitle in sentence case: capitalize only the first word and proper nouns, never Title Case.`;

export function outlinePrompt(input: {
  brief: string;
  clientName: string | null;
  sourceContext: string;
}) {
  return `Propose the slide outline for a new business development deck.

PROJECT BRIEF (from the user):
${input.brief || "(none given)"}

CLIENT: ${input.clientName || "(not specified)"}

SOURCES SHARED BY THE USER:
${input.sourceContext || "(no sources shared)"}

Produce between 8 and 14 slides. If any source is marked relevant for "template" or "both", mirror that deck's section order and section naming as closely as the brief allows. Otherwise use a strong standard BD arc.
For each slide give a concrete title (not a generic section label) and a one-sentence purpose describing what that slide must land.`;
}

export function slidesPrompt(input: {
  brief: string;
  clientName: string | null;
  sourceContext: string;
  outline: OutlineItem[];
}) {
  return `Write the full deck content.

PROJECT BRIEF:
${input.brief || "(none given)"}

CLIENT: ${input.clientName || "(not specified)"}

CONFIRMED OUTLINE (write exactly these slides, in this order):
${input.outline.map((item, i) => `${i + 1}. ${item.title} — ${item.purpose}`).join("\n")}

SOURCES:
${input.sourceContext || "(no sources shared)"}

For every slide return: title, an optional one-line subtitle, 3 to 5 bullets (each under 20 words), speaker notes of 2-3 sentences the presenter can say out loud, and a layout chosen from: ${SLIDE_LAYOUTS.join(", ")}.
Use "title" for the opening slide and "closing" for the final next-steps slide.
Use "section" sparingly, as a divider between the major parts of the deck: a short title, optionally a one-line kicker as the subtitle, and no bullets.
Use "two-column" only for a real contrast (before/after, problem/solution, them/us): give 4 to 6 bullets that read naturally when split evenly into a left and a right half.`;
}

export function regeneratePrompt(input: {
  brief: string;
  clientName: string | null;
  sourceContext: string;
  slide: { title: string; purpose: string };
  neighbours: string[];
  nudge: string;
}) {
  return `Rewrite a single slide in an existing deck.

PROJECT BRIEF:
${input.brief || "(none given)"}

CLIENT: ${input.clientName || "(not specified)"}

THE SLIDE TO REWRITE: "${input.slide.title}" — ${input.slide.purpose}

OTHER SLIDE TITLES IN THE DECK (do not duplicate their content):
${input.neighbours.join("\n") || "(none)"}

WHAT THE USER WANTS CHANGED:
${input.nudge || "Make it sharper and more specific."}

SOURCES:
${input.sourceContext || "(no sources shared)"}

Return the rewritten slide only.`;
}
