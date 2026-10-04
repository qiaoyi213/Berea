import { describe, expect, it } from "vitest";
import { duplicateCandidates, normalizeDoi, parseArxiv, validateBackup } from "../lib/domain";
import type { AppState, Paper } from "../lib/types";

const paper: Paper = { id:"p1",title:"A Robust Decoder",authors:[],doi:"10.1000/ABC",source:"test",readingStatus:"queued",groupIds:[] };

describe("識別碼正規化與重複提示", () => {
  it("正規化 DOI", () => expect(normalizeDoi(" HTTPS://doi.org/10.1000/ABC. ")).toBe("10.1000/abc"));
  it("分開 arXiv 基礎 ID 與版本", () => expect(parseArxiv("https://arxiv.org/abs/2401.01234v3")).toEqual({base:"2401.01234",version:3}));
  it("DOI 精確匹配、標題僅提示", () => {
    expect(duplicateCandidates({doi:"doi:10.1000/abc"},[paper])[0].strength).toBe("exact");
    expect(duplicateCandidates({title:"A Robust Decoder"},[{...paper,doi:undefined}])[0].strength).toBe("possible");
  });
});

describe("備份版本", () => {
  it("拒絕未知 schemaVersion", () => expect(()=>validateBackup({schemaVersion:2})).toThrow());
  it("保留 project scope 與證據關聯", () => { const state={schemaVersion:1,project:{id:"p",name:"n",question:"q",scope:"s",template:"free"},papers:[],groups:[],evidence:[],columns:[],cells:[],ideas:[],updatedAt:"now"} satisfies AppState; expect(validateBackup(JSON.parse(JSON.stringify(state)))).toEqual(state); });
});
