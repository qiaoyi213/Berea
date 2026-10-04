import { NextResponse } from "next/server";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import Papa from "papaparse";
import { normalizeDoi, parseArxiv } from "@/lib/domain";

type Csl = { id?: string; title?: string; author?: { given?: string; family?: string; literal?: string }[]; issued?: { "date-parts"?: number[][] }; DOI?: string; URL?: string; abstract?: string; "container-title"?: string };
const map = (x: Csl, raw: string) => { const arxiv = parseArxiv(x.URL); return { id: crypto.randomUUID(), title: x.title || "未命名文獻", authors: (x.author ?? []).map((a) => a.literal || [a.given, a.family].filter(Boolean).join(" ")), year: x.issued?.["date-parts"]?.[0]?.[0], abstract: x.abstract, doi: normalizeDoi(x.DOI) || undefined, arxivBase: arxiv?.base, arxivVersion: arxiv?.version, venue: x["container-title"], url: x.URL, source: "import", raw, readingStatus: "queued", groupIds: [] } };

export async function POST(request: Request) {
  try {
    const { format, raw, mapping = {} } = await request.json() as { format: "bibtex" | "ris" | "csv"; raw: string; mapping?: Record<string,string> };
    if (typeof raw !== "string" || raw.length > 8_000_000) throw new Error("檔案過大或格式錯誤");
    if (format === "csv") {
      const parsed = Papa.parse<Record<string,string>>(raw, { header: true, skipEmptyLines: true });
      const pick = (row: Record<string,string>, key: string, aliases: string[]) => row[mapping[key]] ?? aliases.map((a) => row[a]).find(Boolean) ?? "";
      const papers = parsed.data.map((row) => { const arxiv = parseArxiv(pick(row,"arxiv",["arXiv","ArXiv ID"])); return { id: crypto.randomUUID(), title: pick(row,"title",["Title","title","Document Title"]), authors: pick(row,"authors",["Authors","Author","authors"]).split(/;|\band\b/).map((x)=>x.trim()).filter(Boolean), year: Number(pick(row,"year",["Year","Publication Year"])) || undefined, doi: normalizeDoi(pick(row,"doi",["DOI","Doi"])) || undefined, arxivBase: arxiv?.base, arxivVersion: arxiv?.version, venue: pick(row,"venue",["Source title","Publication","Journal"]), url: pick(row,"url",["URL","ArticleURL"]), source: "Publish or Perish / CSV", raw: JSON.stringify(row), readingStatus: "queued", groupIds: [] }; });
      return NextResponse.json({ papers, fields: parsed.meta.fields, errors: parsed.errors });
    }
    const data = new Cite(raw).data as Csl[];
    return NextResponse.json({ papers: data.map((x) => map(x, raw)), errors: [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "無法解析" }, { status: 400 });
  }
}
