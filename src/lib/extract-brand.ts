// Browser-only brand extraction from an uploaded .pptx template.
// Reads the Office theme (colour scheme + font scheme) and the master logo.

import { DEFAULT_BRAND, isLight, type Brand } from "./brand";

type Zip = import("jszip");

function attr(xml: string, tag: string): string | null {
  const block = xml.match(new RegExp(`<a:${tag}>([\\s\\S]*?)</a:${tag}>`));
  if (!block) return null;
  const srgb = block[1]!.match(/<a:srgbClr val="([0-9a-fA-F]{6})"/);
  if (srgb) return `#${srgb[1]!.toUpperCase()}`;
  const sys = block[1]!.match(/lastClr="([0-9a-fA-F]{6})"/);
  if (sys) return `#${sys[1]!.toUpperCase()}`;
  return null;
}

function typeface(xml: string, scheme: "majorFont" | "minorFont"): string | null {
  const block = xml.match(new RegExp(`<a:${scheme}>([\\s\\S]*?)</a:${scheme}>`));
  if (!block) return null;
  const latin = block[1]!.match(/<a:latin typeface="([^"]*)"/);
  const name = latin?.[1]?.trim();
  if (!name || name.startsWith("+")) return null;
  return name;
}

async function findLogo(zip: Zip): Promise<string | null> {
  const rels = zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels");
  const targets: string[] = [];
  if (rels) {
    const xml = await rels.async("string");
    for (const match of xml.matchAll(/Target="([^"]*media\/[^"]+)"/g)) {
      targets.push(`ppt/${match[1]!.replace(/^\.\.\//, "")}`);
    }
  }
  if (!targets.length) {
    targets.push(
      ...Object.keys(zip.files).filter((n) => /^ppt\/media\/image\d+\.(png|jpg|jpeg)$/i.test(n)),
    );
  }

  for (const name of targets) {
    const file = zip.file(name);
    if (!file) continue;
    const blob = await file.async("blob");
    if (blob.size > 400_000) continue;
    const ext = name.split(".").pop()!.toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    const base64 = await file.async("base64");
    return `data:${mime};base64,${base64}`;
  }
  return null;
}

export async function extractBrandFromPptx(file: File): Promise<Brand | null> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const themeName = Object.keys(zip.files).find((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n));
    if (!themeName) return null;
    const theme = await zip.files[themeName]!.async("string");

    const dk1 = attr(theme, "dk1") ?? "#1F2733";
    const dk2 = attr(theme, "dk2") ?? dk1;
    const lt1 = attr(theme, "lt1") ?? "#FFFFFF";
    const lt2 = attr(theme, "lt2") ?? "#F2EDE4";
    const accent1 = attr(theme, "accent1");
    const accent2 = attr(theme, "accent2");

    const dark = !isLight(dk2) ? dk2 : !isLight(dk1) ? dk1 : "#1F2733";
    let accent = accent1 ?? DEFAULT_BRAND.colors.accent;
    if (accent.toUpperCase() === dark.toUpperCase() && accent2) accent = accent2;

    const heading = !isLight(dk1) ? dk1 : dark;
    const logo = await findLogo(zip);

    const headingFont = typeface(theme, "majorFont");
    const bodyFont = typeface(theme, "minorFont");

    return {
      source: file.name,
      colors: {
        dark,
        light: isLight(lt1) ? lt1 : "#FFFFFF",
        tint: isLight(lt2) ? lt2 : "#F2F2F2",
        accent,
        heading,
        body: heading,
        onDark: isLight(lt1) ? lt1 : "#FFFFFF",
      },
      fonts: {
        heading: headingFont ? `"${headingFont}", Georgia, serif` : DEFAULT_BRAND.fonts.heading,
        body: bodyFont ? `"${bodyFont}", Calibri, sans-serif` : DEFAULT_BRAND.fonts.body,
      },
      logo,
    };
  } catch (error) {
    console.error("brand extraction failed", error);
    return null;
  }
}
