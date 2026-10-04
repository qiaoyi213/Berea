import { describe, expect, it } from "vitest";
import {
  addToLibrary,
  bibtex,
  citation,
  metrics,
  scholarUrl,
} from "../app/scholar-search";

describe("Scholar search", () => {
  it("builds the official advanced-search URL", () => {
    const url = new URL(
      scholarUrl({
        id: "1",
        name: "q",
        all: "quantum code",
        exact: "belief propagation",
        any: "decoder decoding",
        without: "classical",
        author: "A Smith",
        publication: "Nature",
        from: "2020",
        to: "2025",
        searchedAt: "",
      }),
    );
    expect(url.hostname).toBe("scholar.google.com");
    expect(url.searchParams.get("as_epq")).toBe("belief propagation");
    expect(url.searchParams.get("as_ylo")).toBe("2020");
  });
  it("calculates h-index and g-index", () => {
    const papers = [10, 8, 5, 4, 3].map((citations, i) => ({
      id: String(i),
      title: "x",
      authors: [],
      citations,
      source: "test",
      importedAt: "",
    }));
    expect(metrics(papers)).toMatchObject({ papers: 5, total: 30, h: 4, g: 5 });
  });
  it("creates copyable BibTeX with escaping", () => {
    const text = bibtex({
      id: "1",
      title: "A & B",
      authors: ["Lin, A"],
      year: 2025,
      publication: "Test",
      citations: 0,
      doi: "10.1/x",
      source: "test",
      importedAt: "",
    });
    expect(text).toContain("title = {A \\& B}");
    expect(text).toContain("doi = {10.1/x}");
  });
  it("copies common citation formats", () => {
    const paper = {
      id: "1",
      title: "A useful paper",
      authors: ["Ada Lovelace"],
      year: 2025,
      publication: "Computing",
      citations: 0,
      source: "test",
      importedAt: "",
    };
    expect(citation(paper, "apa")).toContain("Ada Lovelace (2025)");
    expect(citation(paper, "ris")).toContain("TY  - JOUR");
  });
  it("imports only on request, de-duplicates, and assigns a folder", () => {
    const paper = {
      id: "1",
      title: "Paper",
      authors: [],
      citations: 0,
      source: "OpenAlex",
      importedAt: "",
    };
    const library = addToLibrary([], [paper], "量子碼");
    expect(library[0].collectionIds).toEqual(["量子碼"]);
    expect(addToLibrary(library, [paper])).toHaveLength(1);
  });
});
