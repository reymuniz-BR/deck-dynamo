// The approved slide layouts. This is the single source of truth: the generation
// schema, the prompt, the editor dropdown, the preview and the PPTX export all
// import from here so the set can never drift.

export const SLIDE_LAYOUTS = [
  "title",
  "section",
  "bullets",
  "two-column",
  "stat",
  "quote",
  "closing",
] as const;

export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title: "Title",
  section: "Section break",
  bullets: "Bullets",
  "two-column": "Two column",
  stat: "Statistic",
  quote: "Quote",
  closing: "Closing",
};

/** Anything outside the approved set renders as plain bullets. */
export function normalizeLayout(value: string | null | undefined): SlideLayout {
  return value && (SLIDE_LAYOUTS as readonly string[]).includes(value)
    ? (value as SlideLayout)
    : "bullets";
}

/** Split bullets into the two halves of a two-column slide. */
export function splitColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}
