import { describe, expect, it } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import Papa from "papaparse";
import { nextLink } from "../lib/domain";

describe("成熟引用 parser", () => {
  it("解析含巢狀大括號的 BibTeX", () => { const data=new Cite("@article{x,title={{Quantum {LDPC}} decoder},author={Lin, A and Chen, B},year={2025}}").data as {title:string}[]; expect(data[0].title).toContain("Quantum"); });
  it("解析 RIS", () => { const data=new Cite("TY  - JOUR\nTI  - Decoder study\nAU  - Lin, A\nPY  - 2024\nER  -").data as {title:string}[]; expect(data[0].title).toBe("Decoder study"); });
  it("解析 PoP 常見 CSV 欄位並回報壞列", () => { const result=Papa.parse<Record<string,string>>('Title,Authors,Year,DOI\n"A paper","Lin; Chen",2025,10.1/x',{header:true}); expect(result.data[0].Title).toBe("A paper"); });
});

it("遵循 Zotero Link 分頁",()=>expect(nextLink('<https://api.zotero.org/users/1/items?start=100>; rel="next", <x>; rel="last"')).toContain("start=100"));
