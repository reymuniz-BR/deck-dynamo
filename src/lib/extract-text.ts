// Browser-only text extraction for uploaded source files.
// Runs in the client so the edge runtime never has to parse binaries.

function xmlText(xml: string, tag: string) {
  const matches = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g")) ?? [];
  return matches
    .map((m) => m.replace(/<[^>]+>/g, ""))
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function extractZipXml(file: File, folder: string, tag: string, joiner: string) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const names = Object.keys(zip.files)
    .filter((name) => name.startsWith(folder) && name.endsWith(".xml"))
    .sort((a, b) => {
      const na = Number(a.replace(/\D/g, "")) || 0;
      const nb = Number(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });

  const parts: string[] = [];
  for (const name of names) {
    const xml = await zip.files[name]!.async("string");
    const text = xmlText(xml, tag).trim();
    if (text) parts.push(text);
  }
  return parts.join(joiner);
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(`[Page ${i}] ${text}`);
  }
  return pages.join("\n\n");
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".pptx")) {
      return await extractZipXml(file, "ppt/slides/", "a:t", "\n--- slide ---\n");
    }
    if (name.endsWith(".docx")) {
      return await extractZipXml(file, "word/document", "w:t", "\n");
    }
    if (name.endsWith(".pdf")) {
      return await extractPdf(file);
    }
    return await file.text();
  } catch (error) {
    console.error("extraction failed", error);
    return "";
  }
}

export const ACCEPTED_FILE_TYPES = ".pptx,.pdf,.docx,.txt,.md,.csv";
