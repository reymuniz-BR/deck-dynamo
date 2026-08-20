import type { Deck, Slide } from "./deck-types";
import { brandOrDefault, fontFace, hex, type Brand } from "./brand";
import { normalizeLayout, splitColumns } from "./slide-layouts";
import { slideTheme } from "./palette";

export async function exportDeckToPptx(deck: Deck, slides: Slide[], brandInput?: Brand) {
  const brand = brandInput ?? brandOrDefault(deck.brand);
  const HEAD_FONT = fontFace(brand.fonts.heading);
  const BODY_FONT = fontFace(brand.fonts.body);

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Deck Studio";
  pptx.title = deck.title;

  const addLogo = (s: ReturnType<typeof pptx.addSlide>, logo: string | null) => {
    if (!logo) return;
    try {
      s.addImage({
        data: logo,
        x: 8.1,
        y: 0.25,
        w: 1.2,
        h: 0.5,
        sizing: { type: "contain", w: 1.2, h: 0.5 },
      });
    } catch {
      /* ignore unusable logo data */
    }
  };

  slides.forEach((slide, index) => {
    const layout = normalizeLayout(slide.layout);
    // Per-slide colors and logo, matching SlidePreview exactly.
    const theme = slideTheme(brand, layout, index);
    const INK = hex(theme.colors.dark);
    const ACCENT = hex(theme.colors.accent);
    const TINT = hex(theme.colors.tint);
    const LIGHT = hex(theme.colors.light);
    const HEADING = hex(theme.colors.heading);
    const BODY = hex(theme.colors.body);
    const ON_DARK = hex(theme.colors.onDark);

    const s = pptx.addSlide();
    const isDark = layout === "title" || layout === "closing" || layout === "section";
    s.background = { color: isDark ? INK : LIGHT };

    if (layout === "section") {
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      if (slide.subtitle) {
        s.addText(slide.subtitle.toUpperCase(), {
          x: 0.8,
          y: 1.6,
          w: 8.4,
          h: 0.5,
          fontSize: 13,
          charSpacing: 3,
          color: ON_DARK,
          fontFace: BODY_FONT,
        });
      }
      s.addText(slide.title, {
        x: 0.8,
        y: 2.1,
        w: 8.4,
        h: 1.6,
        fontSize: 40,
        bold: true,
        color: ON_DARK,
        fontFace: HEAD_FONT,
      });
      addLogo(s, theme.logo);
    } else if (isDark) {
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      s.addText(slide.title, {
        x: 0.8,
        y: 1.7,
        w: 8.4,
        h: 1.6,
        fontSize: 46,
        bold: true,
        color: ON_DARK,
        fontFace: HEAD_FONT,
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8,
          y: 3.3,
          w: 8.4,
          h: 0.8,
          fontSize: 20,
          color: TINT,
          fontFace: BODY_FONT,
        });
      }
      if (slide.bullets.length) {
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
          {
            x: 0.8,
            y: 4.0,
            w: 8.4,
            h: 1.2,
            fontSize: 16,
            color: TINT,
            fontFace: BODY_FONT,
            lineSpacingMultiple: 1.2,
          },
        );
      }
      addLogo(s, theme.logo);
    } else if (layout === "stat" && slide.bullets.length) {
      s.addText(slide.title, {
        x: 0.7,
        y: 0.5,
        w: 8.6,
        h: 0.9,
        fontSize: 34,
        bold: true,
        color: HEADING,
        fontFace: HEAD_FONT,
      });
      const cols = Math.min(slide.bullets.length, 3);
      slide.bullets.slice(0, 3).forEach((bullet, i) => {
        const w = 8.6 / cols;
        s.addShape("rect", {
          x: 0.7 + i * w,
          y: 1.8,
          w: w - 0.25,
          h: 2.4,
          fill: { color: TINT },
        });
        s.addText(bullet, {
          x: 0.9 + i * w,
          y: 2.0,
          w: w - 0.65,
          h: 2.0,
          fontSize: 18,
          color: HEADING,
          fontFace: BODY_FONT,
          valign: "middle",
        });
      });
      addLogo(s, theme.logo);
    } else if (layout === "quote") {
      s.background = { color: TINT };
      s.addText(slide.title, {
        x: 1.0,
        y: 1.6,
        w: 8.0,
        h: 2.0,
        fontSize: 32,
        italic: true,
        color: HEADING,
        fontFace: HEAD_FONT,
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 1.0,
          y: 3.7,
          w: 8.0,
          h: 0.5,
          fontSize: 16,
          color: ACCENT,
          fontFace: BODY_FONT,
        });
      }
      addLogo(s, theme.logo);
    } else {
      s.addText(slide.title, {
        x: 0.7,
        y: 0.5,
        w: 8.6,
        h: 0.9,
        fontSize: 34,
        bold: true,
        color: HEADING,
        fontFace: HEAD_FONT,
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.7,
          y: 1.35,
          w: 8.6,
          h: 0.5,
          fontSize: 17,
          color: ACCENT,
          fontFace: BODY_FONT,
        });
      }
      s.addShape("rect", { x: 0.7, y: 1.95, w: 1.1, h: 0.06, fill: { color: ACCENT } });
      if (layout === "two-column" && slide.bullets.length) {
        const [left, right] = splitColumns(slide.bullets);
        const columnText = (bullets: string[], x: number) => {
          if (!bullets.length) return;
          s.addText(
            bullets.map((b) => ({ text: b, options: { bullet: true } })),
            {
              x,
              y: 2.25,
              w: 4.0,
              h: 2.8,
              fontSize: 17,
              color: BODY,
              fontFace: BODY_FONT,
              lineSpacingMultiple: 1.35,
            },
          );
        };
        columnText(left, 0.7);
        columnText(right, 5.15);
        s.addShape("rect", { x: 4.95, y: 2.35, w: 0.02, h: 2.5, fill: { color: TINT } });
      } else if (slide.bullets.length) {
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
          {
            x: 0.7,
            y: 2.25,
            w: 8.6,
            h: 2.8,
            fontSize: 19,
            color: BODY,
            fontFace: BODY_FONT,
            lineSpacingMultiple: 1.35,
          },
        );
      }
      addLogo(s, theme.logo);
    }

    if (slide.speaker_notes) s.addNotes(slide.speaker_notes);
  });

  const fileName = `${deck.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "deck"}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
