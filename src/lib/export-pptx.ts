import type { Deck, Slide } from "./deck-types";

const INK = "1F2733";
const ACCENT = "C05621";
const SAND = "F2EDE4";
const BODY = "3A4351";

export async function exportDeckToPptx(deck: Deck, slides: Slide[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Deck Studio";
  pptx.title = deck.title;

  for (const slide of slides) {
    const s = pptx.addSlide();
    const isDark = slide.layout === "title" || slide.layout === "closing";
    s.background = { color: isDark ? INK : "FFFFFF" };

    if (isDark) {
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      s.addText(slide.title, {
        x: 0.8,
        y: 1.7,
        w: 8.4,
        h: 1.6,
        fontSize: 46,
        bold: true,
        color: "FFFFFF",
        fontFace: "Georgia",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8,
          y: 3.3,
          w: 8.4,
          h: 0.8,
          fontSize: 20,
          color: SAND,
          fontFace: "Calibri",
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
            color: SAND,
            fontFace: "Calibri",
            lineSpacingMultiple: 1.2,
          },
        );
      }
    } else if (slide.layout === "stat" && slide.bullets.length) {
      s.addText(slide.title, {
        x: 0.7,
        y: 0.5,
        w: 8.6,
        h: 0.9,
        fontSize: 34,
        bold: true,
        color: INK,
        fontFace: "Georgia",
      });
      const cols = Math.min(slide.bullets.length, 3);
      slide.bullets.slice(0, 3).forEach((bullet, i) => {
        const w = 8.6 / cols;
        s.addShape("rect", {
          x: 0.7 + i * w,
          y: 1.8,
          w: w - 0.25,
          h: 2.4,
          fill: { color: SAND },
        });
        s.addText(bullet, {
          x: 0.9 + i * w,
          y: 2.0,
          w: w - 0.65,
          h: 2.0,
          fontSize: 18,
          color: INK,
          fontFace: "Calibri",
          valign: "middle",
        });
      });
    } else if (slide.layout === "quote") {
      s.background = { color: SAND };
      s.addText(slide.title, {
        x: 1.0,
        y: 1.6,
        w: 8.0,
        h: 2.0,
        fontSize: 32,
        italic: true,
        color: INK,
        fontFace: "Georgia",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 1.0,
          y: 3.7,
          w: 8.0,
          h: 0.5,
          fontSize: 16,
          color: ACCENT,
          fontFace: "Calibri",
        });
      }
    } else {
      s.addText(slide.title, {
        x: 0.7,
        y: 0.5,
        w: 8.6,
        h: 0.9,
        fontSize: 34,
        bold: true,
        color: INK,
        fontFace: "Georgia",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.7,
          y: 1.35,
          w: 8.6,
          h: 0.5,
          fontSize: 17,
          color: ACCENT,
          fontFace: "Calibri",
        });
      }
      s.addShape("rect", { x: 0.7, y: 1.95, w: 1.1, h: 0.06, fill: { color: ACCENT } });
      if (slide.bullets.length) {
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
          {
            x: 0.7,
            y: 2.25,
            w: 8.6,
            h: 2.8,
            fontSize: 19,
            color: BODY,
            fontFace: "Calibri",
            lineSpacingMultiple: 1.35,
          },
        );
      }
    }

    if (slide.speaker_notes) s.addNotes(slide.speaker_notes);
  }

  const fileName = `${deck.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "deck"}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
