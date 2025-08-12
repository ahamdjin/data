import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { chunkText } from "@/ingest/chunker";

export function parseHtmlToChunks(html: string, opts?: { maxTokens?: number; overlap?: number }) {
  const dom = new JSDOM(html, { url: "https://local/" });
  const doc = dom.window.document;

  // Try readability
  let title = doc.querySelector("title")?.textContent ?? undefined;
  let content = "";
  try {
    const article = new Readability(doc).parse();
    if (article?.textContent) {
      title = article.title || title;
      content = article.textContent;
    }
  } catch {
    // fallback below
  }
  if (!content) {
    // fallback: strip scripts/styles and get body text
    doc.querySelectorAll("script,style,noscript").forEach(n => n.remove());
    content = doc.body?.textContent ?? "";
  }

  const clean = content.trim();
  if (!clean) return { title, chunks: [] as { ordinal: number; content: string }[] };
  const chunks = chunkText(clean, { maxTokens: opts?.maxTokens ?? 4000, overlap: opts?.overlap ?? 200 });
  return { title, chunks };
}
