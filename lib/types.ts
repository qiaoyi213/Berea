export type Paper = { id: string; title: string; authors: string[]; year?: number; abstract?: string; doi?: string; arxivBase?: string; arxivVersion?: number; venue?: string; url?: string; source: string; raw?: string; readingStatus: string; groupIds: string[]; attachment?: { id: string; filename: string; lastPage: number } };
export type Evidence = { id: string; paperId: string; attachmentId?: string; page?: number; section?: string; quote: string; note: string; kind: "quote" | "page" };
export type Group = { id: string; name: string; summary: string; assumptions: string; context: string; questions: string };
export type Column = { id: string; name: string; type: "text" | "number" | "single" | "multi" | "boolean" | "formula"; position: number; hidden: boolean; width: number };
export type Cell = { id: string; paperId: string; schemaId: string; value: string; missingKind: "present" | "missing" | "unknown" | "na" | "negative"; judgmentKind: "author_claim" | "other_critique" | "user_inference" | "verified_result"; verification: "pending" | "verified"; verificationBasis?: string; evidenceIds: string[] };
export type Idea = { id: string; problem: string; limitation: string; cause: string; modification: string; prediction: string; failureCondition: string; validation: string; novelty: "not_found" | "suspected_gap" | "confirmed_limit"; status: string; relatedPaperIds: string[]; evidenceIds: string[]; result?: string };
export type Project = { id: string; name: string; question: string; scope: string; template: string; archivedAt?: string };
export type AppState = { schemaVersion: 1; project: Project; papers: Paper[]; groups: Group[]; evidence: Evidence[]; columns: Column[]; cells: Cell[]; ideas: Idea[]; updatedAt: string };

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
