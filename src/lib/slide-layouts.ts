// The approved slide layouts. This is the single source of truth: the generation
// schema, the prompt, the editor dropdown, the preview and the PPTX export all
// import from here so the set can never drift.

export const SLIDE_LAYOUTS = [
  "title",
  "section",
  "bullets",
  "two-column",
  "pillars",
  "process",
  "stat",
  "case-study",
  "quote",
  "closing",
] as const;

export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title: "Title",
  section: "Section break",
  bullets: "Bullets",
  "two-column": "Two column",
  pillars: "Three pillars",
  process: "Numbered steps",
  stat: "Statistics",
  "case-study": "Case study",
  quote: "Quote",
  closing: "Closing",
};

/** Layouts that are a statement only: a headline slide carrying no body copy. */
export const TEXT_ONLY_LAYOUTS: SlideLayout[] = ["title", "section", "quote", "closing"];

/**
 * Bullets are authored as "Short label: full sentence." Splitting them lets the
 * label carry weight the way a real deck sets it. Falls back to the whole
 * string when there is no label, so an unsplit bullet still renders.
 */
export function splitBullet(text: string): { label: string | null; body: string } {
  const at = text.indexOf(":");
  if (at > 0 && at <= 42) {
    const label = text.slice(0, at).trim();
    const body = text.slice(at + 1).trim();
    if (label && body && label.split(/\s+/).length <= 7) return { label, body };
  }
  return { label: null, body: text };
}

/**
 * Canonicalizes a layout name; anything outside the approved set becomes plain
 * bullets. Tolerates the spacing and casing variants models reach for
 * ("Two Column", "two_column") rather than discarding a usable slide.
 */
export function normalizeLayout(value: string | null | undefined): SlideLayout {
  if (!value) return "bullets";
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return (SLIDE_LAYOUTS as readonly string[]).includes(key) ? (key as SlideLayout) : "bullets";
}

/** Split bullets into the two halves of a two-column slide. */
export function splitColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}
