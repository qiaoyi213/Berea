import type { AppState, Paper } from "./types";

export function normalizeDoi(value = "") {
  return value.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "").replace(/[\s.]+$/, "");
}

export function parseArxiv(value = "") {
  const match = value.trim().match(/(?:arxiv:|abs\/|pdf\/)?([a-z.-]+\/\d{7}|\d{4}\.\d{4,5})(?:v(\d+))?/i);
  return match ? { base: match[1].toLowerCase(), version: match[2] ? Number(match[2]) : undefined } : undefined;
}

export function nextLink(value: string | null) {
  return value?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
}

const compactTitle = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function duplicateCandidates(incoming: Partial<Paper>, existing: Paper[]) {
  const doi = normalizeDoi(incoming.doi);
  const arxiv = incoming.arxivBase?.toLowerCase();
  const title = compactTitle(incoming.title ?? "");
  const matches: { paper: Paper; reason: string; strength: "exact" | "possible" }[] = [];
  for (const paper of existing) {
    if (doi && normalizeDoi(paper.doi) === doi) matches.push({ paper, reason: "DOI 完全相同", strength: "exact" });
    else if (arxiv && paper.arxivBase?.toLowerCase() === arxiv) matches.push({ paper, reason: "arXiv 基礎 ID 相同", strength: "exact" });
    else if (title.length > 12 && compactTitle(paper.title) === title) matches.push({ paper, reason: "標題相似，請人工確認", strength: "possible" });
  }
  return matches;
}

export function validateBackup(value: unknown): AppState {
  if (!value || typeof value !== "object" || (value as { schemaVersion?: unknown }).schemaVersion !== 1) throw new Error("不支援的備份版本");
  const state = value as AppState;
  if (!state.project?.id || !Array.isArray(state.papers) || !Array.isArray(state.evidence)) throw new Error("備份內容不完整");
  return state;
}
