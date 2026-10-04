import { NextResponse } from "next/server";
import { z } from "zod";

const input = z.object({
  q: z.string().trim().min(2).max(300),
  cursor: z.string().max(500).optional(),
  from: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});
type Index = Record<string, number[]> | null;
function abstract(index: Index) {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index))
    for (const position of positions) words[position] = word;
  return words.join(" ");
}
export async function POST(request: Request) {
  try {
    const value = input.parse(await request.json());
    const params = new URLSearchParams({
      search: value.q,
      "per-page": "50",
      cursor: value.cursor || "*",
      select:
        "id,doi,title,publication_year,authorships,primary_location,cited_by_count,abstract_inverted_index,type",
    });
    const years = [
      value.from && `from_publication_date:${value.from}-01-01`,
      value.to && `to_publication_date:${value.to}-12-31`,
    ]
      .filter(Boolean)
      .join(",");
    if (years) params.set("filter", years);
    if (process.env.OPENALEX_API_KEY)
      params.set("api_key", process.env.OPENALEX_API_KEY);
    const response = await fetch(`https://api.openalex.org/works?${params}`, {
      headers: { "User-Agent": "ScholarLens/1.0" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`OpenAlex 回應 ${response.status}`);
    const data = await response.json();
    const papers = (data.results as Record<string, unknown>[]).map((work) => {
      const authorships =
        (work.authorships as
          { author?: { display_name?: string } }[] | undefined) ?? [];
      const location = work.primary_location as {
        landing_page_url?: string;
        source?: { display_name?: string };
      } | null;
      return {
        id: String(work.id),
        title: String(work.title || "未命名文獻"),
        authors: authorships.map((x) => x.author?.display_name).filter(Boolean),
        year: work.publication_year ? Number(work.publication_year) : undefined,
        publication: location?.source?.display_name || "",
        citations: Number(work.cited_by_count || 0),
        url: location?.landing_page_url || String(work.id),
        doi: work.doi
          ? String(work.doi).replace(/^https:\/\/doi.org\//, "")
          : undefined,
        abstract: abstract(work.abstract_inverted_index as Index),
        source: "OpenAlex",
        importedAt: new Date().toISOString(),
      };
    });
    return NextResponse.json({
      papers,
      cursor: data.meta?.next_cursor,
      count: data.meta?.count ?? papers.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "搜尋失敗" },
      { status: 400 },
    );
  }
}
