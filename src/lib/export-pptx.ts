import type PptxGenJS from "pptxgenjs";
import type { Deck, Slide } from "./deck-types";
import { brandOrDefault, fontFace, hex, type Brand } from "./brand";
import { normalizeLayout, splitBullet, splitColumns, TEXT_ONLY_LAYOUTS } from "./slide-layouts";
import { slideTheme } from "./palette";

type TextProps = PptxGenJS.TextProps;

/**
 * PowerPoint uses fixed type sizes in fixed boxes, so unlike the on-screen
 * preview (which scales with the container) long copy will run off the slide
 * unless we size it against the content. Every text box also carries
 * `fit: "shrink"` as a second line of defence in the renderer.
 */
function titleSize(text: string, max: number, min: number) {
  const n = text.length;
  if (n <= 34) return max;
  if (n >= 110) return min;
  return Math.round(max - ((n - 34) / (110 - 34)) * (max - min));
}

function bodySize(items: string[], max: number, min: number) {
  const total = items.join(" ").length + items.length * 12;
  if (total <= 180) return max;
  if (total >= 620) return min;
  return Math.round(max - ((total - 180) / (620 - 180)) * (max - min));
}

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
        y: 0.3,
        w: 1.15,
        h: 0.42,
        sizing: { type: "contain", w: 1.15, h: 0.42 },
      });
    } catch {
      /* ignore unusable logo data */
    }
  };

  slides.forEach((slide, index) => {
    const layout = normalizeLayout(slide.layout);
    const theme = slideTheme(brand, layout, index);
    const INK = hex(theme.colors.dark);
    const ACCENT = hex(theme.colors.accent);
    const TINT = hex(theme.colors.tint);
    const LIGHT = hex(theme.colors.light);
    const HEADING = hex(theme.colors.heading);
    const BODY = hex(theme.colors.body);
    const ON_DARK = hex(theme.colors.onDark);

    // A statement slide never carries body copy, whatever the model returned.
    const bullets = TEXT_ONLY_LAYOUTS.includes(layout) ? [] : slide.bullets;

    const s = pptx.addSlide();
    const isDark =
      layout === "title" || layout === "closing" || layout === "section" || layout === "case-study";
    s.background = { color: isDark ? INK : LIGHT };

    /**
     * Standard header for every light content slide. The block is measured from
     * the real title height, so a one-line headline doesn't leave a hole above
     * the subtitle. Returns the y to build the body from.
     */
    const contentHeader = () => {
      const size = titleSize(slide.title, 32, 22);
      // Roughly how many characters fit on one line of an 8in box at this size.
      const perLine = Math.max(24, Math.round(1380 / size));
      const lines = Math.min(3, Math.ceil(slide.title.length / perLine));
      const titleH = (lines * size * 1.22) / 72;

      s.addText(slide.title, {
        x: 0.7,
        y: 0.55,
        w: 8.0,
        h: titleH,
        fontSize: size,
        bold: true,
        color: HEADING,
        fontFace: HEAD_FONT,
        valign: "top",
        fit: "shrink",
      });

      let y = 0.55 + titleH + 0.1;
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.7,
          y,
          w: 8.0,
          h: 0.34,
          fontSize: 14,
          color: ACCENT,
          fontFace: BODY_FONT,
          fit: "shrink",
        });
        y += 0.46;
      }
      s.addShape("rect", { x: 0.7, y, w: 1.0, h: 0.055, fill: { color: ACCENT } });
      addLogo(s, theme.logo);
      return y + 0.32;
    };

    /** Bottom margin every body block builds down to. */
    const FLOOR = 5.15;

    /** "Label: sentence" bullets, with the label carrying the weight. */
    const richBullets = (
      items: string[],
      x: number,
      y: number,
      w: number,
      h: number,
      size: number,
    ) => {
      const runs: TextProps[] = [];
      for (const raw of items) {
        const { label, body } = splitBullet(raw);
        const spacing = { paraSpaceAfter: size * 0.55 };
        if (label) {
          // The label opens the bullet; the sentence continues the same
          // paragraph, so only the first run carries the bullet glyph.
          runs.push({
            text: `${label}: `,
            options: { ...spacing, bullet: { indent: 14 }, bold: true, color: HEADING },
          });
          runs.push({ text: body, options: { ...spacing, color: BODY, breakLine: true } });
        } else {
          runs.push({
            text: body,
            options: { ...spacing, bullet: { indent: 14 }, color: BODY, breakLine: true },
          });
        }
      }
      s.addText(runs, {
        x,
        y,
        w,
        h,
        fontSize: size,
        fontFace: BODY_FONT,
        lineSpacingMultiple: 1.25,
        valign: "top",
        fit: "shrink",
      });
    };

    if (layout === "title" || layout === "closing") {
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      s.addText(slide.title, {
        x: 0.8,
        y: 1.85,
        w: 8.0,
        h: 1.9,
        fontSize: titleSize(slide.title, 44, 30),
        bold: true,
        color: ON_DARK,
        fontFace: HEAD_FONT,
        valign: "bottom",
        fit: "shrink",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8,
          y: 3.85,
          w: 8.0,
          h: 0.6,
          fontSize: 18,
          color: TINT,
          fontFace: BODY_FONT,
          fit: "shrink",
        });
      }
      addLogo(s, theme.logo);
    } else if (layout === "section") {
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      if (slide.subtitle) {
        s.addText(slide.subtitle.toUpperCase(), {
          x: 0.8,
          y: 2.15,
          w: 8.0,
          h: 0.4,
          fontSize: 12,
          charSpacing: 3,
          color: ON_DARK,
          fontFace: BODY_FONT,
        });
      }
      s.addText(slide.title, {
        x: 0.8,
        y: 2.55,
        w: 8.0,
        h: 1.3,
        fontSize: titleSize(slide.title, 40, 28),
        bold: true,
        color: ON_DARK,
        fontFace: HEAD_FONT,
        valign: "top",
        fit: "shrink",
      });
      addLogo(s, theme.logo);
    } else if (layout === "case-study") {
      // Dark proof slide: eyebrow, client name, then Goal / Approach / Impact.
      s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.63, fill: { color: ACCENT } });
      s.addText("OUR WORK IN ACTION", {
        x: 0.8,
        y: 0.7,
        w: 6.0,
        h: 0.35,
        fontSize: 11,
        charSpacing: 3,
        color: ON_DARK,
        fontFace: BODY_FONT,
      });
      s.addText(slide.title, {
        x: 0.8,
        y: 1.1,
        w: 8.0,
        h: 0.95,
        fontSize: titleSize(slide.title, 30, 22),
        bold: true,
        color: ON_DARK,
        fontFace: HEAD_FONT,
        valign: "top",
        fit: "shrink",
      });
      const size = bodySize(bullets, 15, 11);
      bullets.slice(0, 3).forEach((raw, i) => {
        const { label, body } = splitBullet(raw);
        const y = 2.35 + i * 1.02;
        s.addText(label ? label.replace(/:$/, "").toUpperCase() : `0${i + 1}`, {
          x: 0.8,
          y,
          w: 1.7,
          h: 0.3,
          fontSize: 10,
          charSpacing: 2,
          bold: true,
          color: ACCENT,
          fontFace: BODY_FONT,
        });
        s.addText(body, {
          x: 2.6,
          y: y - 0.04,
          w: 6.2,
          h: 0.9,
          fontSize: size,
          color: ON_DARK,
          fontFace: BODY_FONT,
          lineSpacingMultiple: 1.2,
          valign: "top",
          fit: "shrink",
        });
      });
      addLogo(s, theme.logo);
    } else if (layout === "quote") {
      s.background = { color: TINT };
      s.addText(slide.title, {
        x: 1.0,
        y: 1.5,
        w: 8.0,
        h: 2.2,
        fontSize: titleSize(slide.title, 30, 20),
        italic: true,
        color: HEADING,
        fontFace: HEAD_FONT,
        valign: "middle",
        fit: "shrink",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 1.0,
          y: 3.85,
          w: 8.0,
          h: 0.5,
          fontSize: 14,
          color: ACCENT,
          fontFace: BODY_FONT,
        });
      }
      addLogo(s, theme.logo);
    } else if (layout === "pillars" && bullets.length) {
      const top = contentHeader();
      const items = bullets.slice(0, 3);
      const gap = 0.3;
      const w = (8.6 - gap * (items.length - 1)) / items.length;
      const cardH = FLOOR - top;
      const size = bodySize(items, 13, 10);
      items.forEach((raw, i) => {
        const { label, body } = splitBullet(raw);
        const x = 0.7 + i * (w + gap);
        s.addShape("rect", { x, y: top, w, h: cardH, fill: { color: TINT } });
        s.addShape("rect", { x, y: top, w, h: 0.06, fill: { color: ACCENT } });
        s.addText(label ?? `0${i + 1}`, {
          x: x + 0.22,
          y: top + 0.28,
          w: w - 0.44,
          h: 0.6,
          fontSize: 15,
          bold: true,
          color: HEADING,
          fontFace: HEAD_FONT,
          valign: "top",
          fit: "shrink",
        });
        s.addText(body, {
          x: x + 0.22,
          y: top + 0.95,
          w: w - 0.44,
          h: cardH - 1.15,
          fontSize: size,
          color: BODY,
          fontFace: BODY_FONT,
          lineSpacingMultiple: 1.2,
          valign: "top",
          fit: "shrink",
        });
      });
    } else if (layout === "process" && bullets.length) {
      const top = contentHeader();
      const items = bullets.slice(0, 5);
      const rowH = (FLOOR - top) / items.length;
      const size = bodySize(items, 14, 10);
      items.forEach((raw, i) => {
        const { label, body } = splitBullet(raw);
        const y = top + i * rowH;
        s.addText(`0${i + 1}`, {
          x: 0.7,
          y,
          w: 0.6,
          h: rowH,
          fontSize: size + 4,
          bold: true,
          color: ACCENT,
          fontFace: HEAD_FONT,
          valign: "top",
        });
        s.addText(
          [
            ...(label
              ? [{ text: `${label}: `, options: { bold: true, color: HEADING, breakLine: false } }]
              : []),
            { text: body, options: { color: BODY } },
          ],
          {
            x: 1.35,
            y,
            w: 7.9,
            h: rowH,
            fontSize: size,
            fontFace: BODY_FONT,
            lineSpacingMultiple: 1.15,
            valign: "top",
            fit: "shrink",
          },
        );
      });
    } else if (layout === "stat" && bullets.length) {
      const top = contentHeader();
      const items = bullets.slice(0, 3);
      const gap = 0.28;
      const w = (8.6 - gap * (items.length - 1)) / items.length;
      const cardH = FLOOR - top;
      items.forEach((raw, i) => {
        const { label, body } = splitBullet(raw);
        const x = 0.7 + i * (w + gap);
        s.addShape("rect", { x, y: top, w, h: cardH, fill: { color: TINT } });
        s.addText(label ?? "", {
          x: x + 0.22,
          y: top + 0.3,
          w: w - 0.44,
          h: 0.85,
          fontSize: label && label.length > 12 ? 22 : 30,
          bold: true,
          color: HEADING,
          fontFace: HEAD_FONT,
          valign: "top",
          fit: "shrink",
        });
        s.addText(body, {
          x: x + 0.22,
          y: top + 1.25,
          w: w - 0.44,
          h: cardH - 1.45,
          fontSize: bodySize(items, 12, 10),
          color: BODY,
          fontFace: BODY_FONT,
          lineSpacingMultiple: 1.2,
          valign: "top",
          fit: "shrink",
        });
      });
    } else if (layout === "two-column" && bullets.length) {
      const top = contentHeader();
      const [left, right] = splitColumns(bullets);
      const size = bodySize(bullets, 14, 10);
      if (left.length) richBullets(left, 0.7, top, 3.95, FLOOR - top, size);
      if (right.length) richBullets(right, 5.05, top, 3.95, FLOOR - top, size);
      s.addShape("rect", {
        x: 4.82,
        y: top + 0.05,
        w: 0.02,
        h: FLOOR - top - 0.1,
        fill: { color: TINT },
      });
    } else {
      const top = contentHeader();
      if (bullets.length)
        richBullets(bullets, 0.7, top, 8.3, FLOOR - top, bodySize(bullets, 16, 11));
    }

    if (slide.speaker_notes) s.addNotes(slide.speaker_notes);
  });

  const fileName = `${deck.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "deck"}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
