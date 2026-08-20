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

Produce between 8 and 14 slides. If any source is marked relevant for "template" or "both", mirror that deck's section order and section naming as closely as the brief allows. Otherwise use a strong standard arc: open on the stakes, establish what is already built, name the gap, lay out the approach, prove it with a piece of real work, set out scope and ownership, then close on decisions and next steps.
Use a section divider only where the deck genuinely turns a corner, and include at least one slide of concrete proof if the sources support one.
For each slide give a concrete title written as an assertive claim (not a generic section label) and a one-sentence purpose describing what that slide must land.`;
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

For every slide return: title, subtitle, bullets, speaker notes of 2-3 sentences the presenter can say out loud, and a layout from the approved list.

HOW TO WRITE EACH FIELD
- title: an assertive, complete claim the rest of the slide then proves, roughly 6 to 14 words. "Stable insurance supports stable homes", not "Insurance overview". Never a bare topic label.
- subtitle: a short category eyebrow or a one-line framing sentence. Keep it under 12 words.
- bullets: write each one as "Short label: full sentence." The label is 2 to 5 words and names the idea; the sentence that follows is a real sentence of 15 to 30 words. Example: "Rising premiums: Higher insurance costs consume operating dollars that would otherwise fund repairs and resident services." Never write bare fragments.
- Give content slides 3 to 5 bullets. Four is usually right. Never more than five.

THE APPROVED LAYOUTS (${SLIDE_LAYOUTS.join(", ")})
- title: the opening slide. Give it a title and subtitle and NO bullets at all.
- closing: the final next-steps slide.
- section: a divider between major parts of the deck. Short title, optional kicker as subtitle, NO bullets. Use sparingly, and only when the deck genuinely turns a corner.
- quote: a single quotation as the title, the attribution as the subtitle, NO bullets.
- bullets: the standard content slide.
- two-column: a real contrast only (before and after, problem and solution, them and us). Give 4 or 6 bullets that split evenly into two halves.
- pillars: exactly 3 parallel ideas of equal weight, such as three services or three principles. Each bullet is one pillar in "Label: sentence" form.
- process: sequential steps that happen in order. 3 to 5 bullets, each a step in "Label: sentence" form. Use this when order matters; use pillars when it does not.
- stat: 3 findings that each lead with a number or a bracketed placeholder. Example: "50+ endorsers: Organizations across the state have signed the campaign principles."
- case-study: one piece of proof. Put the client or project name in the title, and give exactly three bullets labelled "Goal:", "Approach:" and "Impact:" in that order.

Vary the layouts. A deck that is ten bullet slides in a row has failed. Reach for pillars, process, stat and case-study wherever the content genuinely fits one, and if a single topic needs two slides, title them "(1 of 2)" and "(2 of 2)".`;
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
