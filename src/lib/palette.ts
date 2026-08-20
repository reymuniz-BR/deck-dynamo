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

export const SECONDARY_FAMILIES: ColorFamily[] = [
  { name: "slate", dark: "#29293F", light: "#B5E6EC" },
  { name: "harbor", dark: "#1F4C76", light: "#FFECBA" },
  { name: "rose", dark: "#A53548", light: "#FCC4AB" },
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
  if (layout === "section") {
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
  if (layout === "section") return ORCHESTRA_LOGO_WHITE;
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
