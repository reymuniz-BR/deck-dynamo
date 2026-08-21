// Orchestra slide palettes. Color families rotate per slide deterministically
// (by position) so the model never chooses colors, and the on-screen preview and
// the PPTX export always agree. For decks carrying an extracted brand this whole
// module is a pass-through: those decks keep rendering exactly as before.

import { DEFAULT_BRAND, type Brand } from "./brand";
import type { SlideLayout } from "./slide-layouts";
import { ORCHESTRA_LOGO_FOREST, ORCHESTRA_LOGO_MINT, ORCHESTRA_LOGO_WHITE } from "./orchestra-logo";

export type ColorFamily = { name: string; dark: string; light: string };

export const NEUTRALS = {
  white: "#FFFFFF",
  panel: "#EFEFEF",
  body: "#333333",
  heading: "#222222",
};

/** Forest + mint: the hero pair, reserved for opening and closing slides. */
export const HERO_FAMILY: ColorFamily = { name: "forest", dark: "#223307", light: "#E7FFD9" };

// Pairings are fixed by the Orchestra master design system's colorRotation
// (catalog.json v3). Each dark tone has one correct light partner; mixing them
// across families is exactly the brand drift this pipeline exists to prevent.
export const SECONDARY_FAMILIES: ColorFamily[] = [
  { name: "slate", dark: "#29293F", light: "#FCC4AB" },
  { name: "blue", dark: "#1F4C76", light: "#B5E6EC" },
  { name: "maroon", dark: "#A53548", light: "#FFECBA" },
];

export function isOrchestraBrand(brand: Brand): boolean {
  return brand.source === DEFAULT_BRAND.source;
}

function familyFor(position: number): ColorFamily {
  return SECONDARY_FAMILIES[position % SECONDARY_FAMILIES.length]!;
}

/** One color family per slide, grounded in neutrals. Deterministic by position. */
export function getSlidePalette(
  brand: Brand,
  layout: SlideLayout,
  position: number,
): Brand["colors"] {
  if (!isOrchestraBrand(brand)) return brand.colors;

  if (layout === "title" || layout === "closing") {
    const f = HERO_FAMILY;
    return {
      dark: f.dark,
      light: NEUTRALS.white,
      tint: f.light,
      accent: f.light,
      heading: f.light,
      body: NEUTRALS.body,
      onDark: f.light,
    };
  }

  const f = familyFor(position);
  // Case studies get the same full-bleed dark treatment as a section break: in a
  // real deck they read as a deliberate change of register, not another list.
  if (layout === "section" || layout === "case-study") {
    return {
      dark: f.dark,
      light: NEUTRALS.white,
      tint: f.light,
      accent: f.light,
      heading: f.light,
      body: NEUTRALS.body,
      onDark: f.light,
    };
  }

  // Content slides: white ground, neutral text, one family as the accent.
  return {
    dark: f.dark,
    light: NEUTRALS.white,
    tint: f.light,
    accent: f.dark,
    heading: NEUTRALS.heading,
    body: NEUTRALS.body,
    onDark: NEUTRALS.white,
  };
}

function getSlideLogo(brand: Brand, layout: SlideLayout): string | null {
  if (!isOrchestraBrand(brand)) return brand.logo;
  if (layout === "title" || layout === "closing") return ORCHESTRA_LOGO_MINT;
  if (layout === "section" || layout === "case-study") return ORCHESTRA_LOGO_WHITE;
  return ORCHESTRA_LOGO_FOREST;
}

/**
 * The per-slide effective brand: same shape the renderer and exporter already
 * consume, with colors and logo resolved for this one slide.
 */
export function slideTheme(brand: Brand, layout: SlideLayout, position: number): Brand {
  if (!isOrchestraBrand(brand)) return brand;
  return {
    ...brand,
    colors: getSlidePalette(brand, layout, position),
    logo: getSlideLogo(brand, layout),
  };
}

/** Swatch strip for the editor header. */
export function familySwatches(brand: Brand): string[] {
  if (!isOrchestraBrand(brand)) return [brand.colors.dark, brand.colors.accent, brand.colors.tint];
  return [HERO_FAMILY.dark, ...SECONDARY_FAMILIES.map((f) => f.dark)];
}
