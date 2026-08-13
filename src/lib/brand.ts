// Brand kit extracted from an uploaded template deck.

export type Brand = {
  source: string;
  colors: {
    dark: string; // deep brand colour, used for title/closing slides
    light: string; // page background
    tint: string; // soft panel fill
    accent: string; // highlight colour
    heading: string; // heading text on light backgrounds
    body: string; // body text on light backgrounds
    onDark: string; // text on the dark background
  };
  fonts: { heading: string; body: string };
  logo: string | null; // data URL
};

export const DEFAULT_BRAND: Brand = {
  source: "Deck Studio default",
  colors: {
    dark: "#1F2733",
    light: "#FFFFFF",
    tint: "#F2EDE4",
    accent: "#C05621",
    heading: "#1F2733",
    body: "#3A4351",
    onDark: "#FFFFFF",
  },
  fonts: { heading: "Georgia, 'Instrument Serif', serif", body: "Calibri, 'Work Sans', sans-serif" },
  logo: null,
};

export function normalizeBrand(value: unknown): Brand | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Brand>;
  if (!raw.colors || !raw.fonts) return null;
  return {
    source: raw.source ?? "Template",
    colors: { ...DEFAULT_BRAND.colors, ...raw.colors },
    fonts: { ...DEFAULT_BRAND.fonts, ...raw.fonts },
    logo: raw.logo ?? null,
  };
}

export function brandOrDefault(value: unknown): Brand {
  return normalizeBrand(value) ?? DEFAULT_BRAND;
}

/** CSS custom properties consumed by SlidePreview. */
export function brandStyle(brand: Brand): React.CSSProperties {
  return {
    ["--b-dark" as string]: brand.colors.dark,
    ["--b-light" as string]: brand.colors.light,
    ["--b-tint" as string]: brand.colors.tint,
    ["--b-accent" as string]: brand.colors.accent,
    ["--b-heading" as string]: brand.colors.heading,
    ["--b-body" as string]: brand.colors.body,
    ["--b-on-dark" as string]: brand.colors.onDark,
    ["--b-font-heading" as string]: brand.fonts.heading,
    ["--b-font-body" as string]: brand.fonts.body,
  };
}

/** pptxgenjs wants bare 6-char hex. */
export function hex(color: string): string {
  const value = color.replace("#", "").trim();
  if (/^[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return value
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  return "000000";
}

/** First family name, for pptx fontFace. */
export function fontFace(stack: string): string {
  return (stack.split(",")[0] ?? "").replace(/['"]/g, "").trim() || "Calibri";
}

export function isLight(color: string): boolean {
  const h = hex(color);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
