"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  ExternalLink,
  FileUp,
  Filter,
  History,
  Library,
  LibraryBig,
  Folder,
  FolderInput,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

type Query = {
  id: string;
  name: string;
  all: string;
  exact: string;
  any: string;
  without: string;
  author: string;
  publication: string;
  from: string;
  to: string;
  searchedAt: string;
};
type Paper = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  publication?: string;
  citations: number;
  url?: string;
  doi?: string;
  abstract?: string;
  tags?: string[];
  collectionIds?: string[];
  note?: string;
  source: string;
  importedAt: string;
  selected?: boolean;
};
type Sort = "citations" | "year" | "title";
const blank = (): Query => ({
  id: crypto.randomUUID(),
  name: "未命名搜尋",
  all: "",
  exact: "",
  any: "",
  without: "",
  author: "",
  publication: "",
  from: "",
  to: "",
  searchedAt: "",
});
const demo: Paper[] = [
  {
    id: "demo-1",
    title:
      "示範資料：Efficient literature discovery under noisy citation metadata",
    authors: ["Demo Author", "Sample Researcher"],
    year: 2024,
    publication: "Journal of Synthetic Examples",
    citations: 128,
    url: "https://scholar.google.com/",
    source: "示範（非真實研究結果）",
    importedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "示範資料：Comparing retrieval strategies for scholarly search",
    authors: ["Example Scholar"],
    year: 2022,
    publication: "Demo Conference",
    citations: 64,
    url: "https://scholar.google.com/",
    source: "示範（非真實研究結果）",
    importedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "示範資料：Evidence-aware ranking in academic workflows",
    authors: [],
    year: 2025,
    publication: "",
    citations: 7,
    source: "示範（非真實研究結果）",
    importedAt: new Date().toISOString(),
  },
];

export function scholarUrl(q: Query) {
  const params = new URLSearchParams();
  if (q.all) params.set("as_q", q.all);
  if (q.exact) params.set("as_epq", q.exact);
  if (q.any) params.set("as_oq", q.any);
  if (q.without) params.set("as_eq", q.without);
  if (q.author) params.set("as_sauthors", q.author);
  if (q.publication) params.set("as_publication", q.publication);
  if (q.from) params.set("as_ylo", q.from);
  if (q.to) params.set("as_yhi", q.to);
  return `https://scholar.google.com/scholar?${params}`;
}
export function metrics(papers: Paper[]) {
  const citations = papers.map((p) => p.citations).sort((a, b) => b - a),
    total = citations.reduce((a, b) => a + b, 0),
    year = new Date().getFullYear();
  let h = 0,
    g = 0,
    sum = 0;
  citations.forEach((c, i) => {
    if (c >= i + 1) h = i + 1;
    sum += c;
    if (sum >= (i + 1) ** 2) g = i + 1;
  });
  const active = papers.filter((p) => p.year),
    span = active.length
      ? Math.max(1, year - Math.min(...active.map((p) => p.year!)) + 1)
      : 1;
  return { papers: papers.length, total, h, g, perYear: total / span };
}

export function bibtex(p: Paper) {
  const key = (
    (p.authors[0]?.split(" ").at(-1) || "paper") +
    (p.year || "nd") +
    p.title.split(/\s+/)[0]
  ).replace(/[^a-z0-9]/gi, "");
  const esc = (value: string) =>
    value.replace(/[{}]/g, "").replaceAll("&", "\\&");
  return `@article{${key},\n  title = {${esc(p.title)}},\n  author = {${p.authors.map(esc).join(" and ")}},\n  year = {${p.year || ""}},\n  journal = {${esc(p.publication || "")}},${p.doi ? `\n  doi = {${p.doi}},` : ""}${p.url ? `\n  url = {${p.url}},` : ""}\n}`;
}
export type CitationFormat = "bibtex" | "apa" | "mla" | "chicago" | "ris";
export function citation(p: Paper, format: CitationFormat) {
  const authors = p.authors.length ? p.authors.join(", ") : "作者未提供";
  const year = p.year || "n.d.";
  const source = p.publication || "";
  const link = p.doi ? `https://doi.org/${p.doi}` : p.url || "";
  if (format === "bibtex") return bibtex(p);
  if (format === "ris")
    return [
      "TY  - JOUR",
      ...p.authors.map((a) => `AU  - ${a}`),
      `TI  - ${p.title}`,
      `PY  - ${p.year || ""}`,
      `JO  - ${source}`,
      ...(p.doi ? [`DO  - ${p.doi}`] : []),
      ...(p.url ? [`UR  - ${p.url}`] : []),
      "ER  -",
    ].join("\n");
  if (format === "mla")
    return `${authors}. “${p.title}.” ${source}${source ? ", " : ""}${year}.${link ? ` ${link}.` : ""}`;
  if (format === "chicago")
    return `${authors}. “${p.title}.” ${source}${source ? " " : ""}(${year}).${link ? ` ${link}.` : ""}`;
  return `${authors} (${year}). ${p.title}. ${source}.${link ? ` ${link}` : ""}`;
}
export function addToLibrary(library: Paper[], items: Paper[], folder = "") {
  const keys = new Set(
    library.map((p) => (p.doi || p.id || p.title).toLowerCase()),
  );
  return [
    ...library,
    ...items
      .filter((p) => !keys.has((p.doi || p.id || p.title).toLowerCase()))
      .map((p) => ({
        ...p,
        selected: false,
        collectionIds: folder ? [folder] : [],
      })),
  ];
}

export default function ScholarSearch() {
  const [query, setQuery] = useState<Query>(blank);
  const [history, setHistory] = useState<Query[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [results, setResults] = useState<Paper[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<Sort>("citations");
  const [compact, setCompact] = useState(true);
  const [advanced, setAdvanced] = useState(true);
  const [panel, setPanel] = useState<"search" | "history">("search");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"search" | "library">("search");
  const [collections, setCollections] = useState<string[]>(["稍後閱讀"]);
  const [cursor, setCursor] = useState<string>();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importFolder, setImportFolder] = useState("");
  const [importItems, setImportItems] = useState<Paper[]>([]);
  const [copyPaper, setCopyPaper] = useState<Paper>();
  const file = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("scholar-lens") || "null",
        );
        if (saved) {
          setHistory(saved.history || []);
          setPapers(saved.papers || []);
          setResults(saved.results || []);
          setCollections(saved.collections || ["稍後閱讀"]);
        }
      } catch {
      } finally {
        hydrated.current = true;
      }
    });
  }, []);
  useEffect(() => {
    if (hydrated.current)
      localStorage.setItem(
        "scholar-lens",
        JSON.stringify({ history, papers, results, collections }),
      );
  }, [history, papers, results, collections]);
  const shown = useMemo(
    () =>
      results
        .filter((p) =>
          [p.title, p.authors.join(" "), p.publication, p.doi]
            .join(" ")
            .toLowerCase()
            .includes(filter.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "citations"
            ? b.citations - a.citations
            : sort === "year"
              ? (b.year || 0) - (a.year || 0)
              : a.title.localeCompare(b.title),
        ),
    [results, filter, sort],
  );
  const stats = metrics(results),
    selected = results.filter((p) => p.selected).length;
  const openSearch = () => {
    if (
      ![query.all, query.exact, query.author, query.publication].some(Boolean)
    ) {
      setNotice("請至少輸入一個搜尋條件");
      return;
    }
    const record = {
      ...query,
      id: crypto.randomUUID(),
      name: query.name || query.all || query.exact,
      searchedAt: new Date().toISOString(),
    };
    setHistory((h) =>
      [record, ...h.filter((x) => scholarUrl(x) !== scholarUrl(record))].slice(
        0,
        30,
      ),
    );
    window.open(scholarUrl(query), "_blank", "noopener,noreferrer");
    setNotice("已在新分頁開啟 Google Scholar；可將結果匯出後回來匯入。");
  };
  const searchOnline = async (more = false) => {
    const q = [
      query.all,
      query.exact && `"${query.exact}"`,
      query.any,
      query.author,
      query.publication,
      query.without && `-${query.without}`,
    ]
      .filter(Boolean)
      .join(" ");
    if (!q) {
      setNotice("請至少輸入一個搜尋條件");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q,
          from: query.from || undefined,
          to: query.to || undefined,
          cursor: more ? cursor : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCursor(data.cursor);
      setTotal(data.count);
      setResults((old) => {
        const base = more ? old : [];
        const ids = new Set(base.map((p) => p.id));
        return [
          ...base,
          ...(data.papers as Paper[]).filter((p) => !ids.has(p.id)),
        ];
      });
      const record = {
        ...query,
        id: crypto.randomUUID(),
        name: query.name || q,
        searchedAt: new Date().toISOString(),
      };
      setHistory((h) =>
        [
          record,
          ...h.filter((x) => scholarUrl(x) !== scholarUrl(record)),
        ].slice(0, 30),
      );
      setNotice(`已載入 ${data.papers.length} 筆 OpenAlex 研究結果`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "搜尋失敗");
    } finally {
      setLoading(false);
    }
  };
  const copyCitation = async (p: Paper, format: CitationFormat) => {
    await navigator.clipboard.writeText(citation(p, format));
    setCopyPaper(undefined);
    setNotice(`${format.toUpperCase()} 已複製`);
  };
  const importFile = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const format =
      ext === "bib" || ext === "bibtex"
        ? "bibtex"
        : ext === "ris"
          ? "ris"
          : "csv";
    const r = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, raw: await f.text() }),
    });
    const data = await r.json();
    if (!r.ok) {
      setNotice(data.error || "匯入失敗");
      return;
    }
    const next: Paper[] = data.papers.map((p: Record<string, unknown>) => {
      let raw: Record<string, unknown> = {};
      try {
        raw = JSON.parse(String(p.raw || "{}"));
      } catch {}
      const cite =
        Number(
          raw.Citations ?? raw.Cites ?? raw["Cited by"] ?? raw.CitedBy ?? 0,
        ) || 0;
      return {
        id: String(p.id),
        title: String(p.title || "未命名文獻"),
        authors: Array.isArray(p.authors) ? p.authors.map(String) : [],
        year: p.year ? Number(p.year) : undefined,
        publication: String(
          p.venue || raw.Publication || raw["Source title"] || "",
        ),
        citations: cite,
        url: p.url ? String(p.url) : undefined,
        doi: p.doi ? String(p.doi) : undefined,
        source: `${format.toUpperCase()} · ${f.name}`,
        importedAt: new Date().toISOString(),
      };
    });
    setPapers((old) => {
      const keys = new Set(old.map((p) => (p.doi || p.title).toLowerCase()));
      return [
        ...old,
        ...next.filter((p) => !keys.has((p.doi || p.title).toLowerCase())),
      ];
    });
    setNotice(`已匯入 ${next.length} 筆；相同 DOI 或標題不重複加入。`);
  };
  const exportCsv = () => {
    const rows = [
      ["Title", "Authors", "Year", "Publication", "Citations", "DOI", "URL"],
      ...papers.map((p) => [
        p.title,
        p.authors.join("; "),
        p.year || "",
        p.publication || "",
        p.citations,
        p.doi || "",
        p.url || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download = "scholar-lens-results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const remove = () => setResults((p) => p.filter((x) => !x.selected));
  const importPapers = (items: Paper[], folder = importFolder) => {
    setPapers((old) => addToLibrary(old, items, folder));
    setResults((all) =>
      all.map((p) =>
        items.some((x) => x.id === p.id) ? { ...p, selected: false } : p,
      ),
    );
    setNotice(`已導入選取文獻${folder ? `到「${folder}」` : "到全部文獻"}`);
  };
  return (
    <div className="app">
      <a className="skip" href="#results">
        跳至搜尋結果
      </a>
      <header className="appbar">
        <div className="logo">
          <span className="logo-mark" aria-hidden="true">
            <i></i>
            <i></i>
            <b>B</b>
          </span>
          <div>
            <strong>Berea</strong>
            <small>Search · Review · Export</small>
          </div>
        </div>
        <nav className="topnav" aria-label="主要頁面">
          <button
            className={view === "search" ? "active" : ""}
            onClick={() => setView("search")}
          >
            <Search size={17} />
            研究搜尋
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            <LibraryBig size={17} />
            我的文獻庫
          </button>
        </nav>
        <div className="app-actions">
          <button className="ghost" onClick={() => file.current?.click()}>
            <FileUp size={17} />
            匯入結果
          </button>
          <button
            className="ghost"
            onClick={exportCsv}
            disabled={!papers.length}
          >
            <Download size={17} />
            匯出 CSV
          </button>
        </div>
      </header>
      {view === "library" ? (
        <LibraryView
          papers={papers}
          setPapers={setPapers}
          collections={collections}
          setCollections={setCollections}
          chooseCopy={setCopyPaper}
        />
      ) : (
        <div className="layout">
          <aside className="side">
            <div className="side-tabs">
              <button
                className={panel === "search" ? "active" : ""}
                onClick={() => setPanel("search")}
              >
                <SlidersHorizontal size={17} />
                搜尋
              </button>
              <button
                className={panel === "history" ? "active" : ""}
                onClick={() => setPanel("history")}
              >
                <History size={17} />
                紀錄 <span>{history.length}</span>
              </button>
            </div>
            {panel === "search" ? (
              <div className="query">
                <div className="side-heading">
                  <div>
                    <h1>建立搜尋</h1>
                    <p>組合 Scholar 進階查詢</p>
                  </div>
                  <button
                    className="icon"
                    aria-label="清除搜尋條件"
                    title="清除搜尋條件"
                    onClick={() => setQuery(blank())}
                  >
                    <X size={17} />
                  </button>
                </div>
                <label>
                  搜尋名稱
                  <input
                    value={query.name}
                    onChange={(e) =>
                      setQuery({ ...query, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  包含所有字詞
                  <input
                    value={query.all}
                    onChange={(e) =>
                      setQuery({ ...query, all: e.target.value })
                    }
                    placeholder="quantum error correction"
                  />
                </label>
                <label>
                  完整詞組
                  <input
                    value={query.exact}
                    onChange={(e) =>
                      setQuery({ ...query, exact: e.target.value })
                    }
                    placeholder="belief propagation"
                  />
                </label>
                <button
                  className="advanced-toggle"
                  aria-expanded={advanced}
                  onClick={() => setAdvanced(!advanced)}
                >
                  <span>進階條件</span>
                  <ChevronDown size={17} />
                </button>
                {advanced && (
                  <div className="advanced">
                    <label>
                      包含任一字詞
                      <input
                        value={query.any}
                        onChange={(e) =>
                          setQuery({ ...query, any: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      排除字詞
                      <input
                        value={query.without}
                        onChange={(e) =>
                          setQuery({ ...query, without: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      作者
                      <input
                        value={query.author}
                        onChange={(e) =>
                          setQuery({ ...query, author: e.target.value })
                        }
                        placeholder="A. Smith"
                      />
                    </label>
                    <label>
                      出版來源
                      <input
                        value={query.publication}
                        onChange={(e) =>
                          setQuery({ ...query, publication: e.target.value })
                        }
                        placeholder="Nature"
                      />
                    </label>
                    <div className="years">
                      <label>
                        起始年份
                        <input
                          type="number"
                          inputMode="numeric"
                          value={query.from}
                          onChange={(e) =>
                            setQuery({ ...query, from: e.target.value })
                          }
                        />
                      </label>
                      <span>—</span>
                      <label>
                        結束年份
                        <input
                          type="number"
                          inputMode="numeric"
                          value={query.to}
                          onChange={(e) =>
                            setQuery({ ...query, to: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}
                <button
                  className="primary"
                  onClick={() => searchOnline(false)}
                  disabled={loading}
                >
                  <Search size={18} />
                  {loading ? "搜尋中…" : "搜尋相關研究"}
                </button>
                <button className="secondary scholar-link" onClick={openSearch}>
                  到 Google Scholar 查看
                  <ArrowUpRight size={16} />
                </button>
                <p className="legal">
                  Berea 不爬取 Google
                  Scholar。搜尋會在新分頁開啟，由你控制查詢與下載。
                </p>
              </div>
            ) : (
              <div className="history">
                {history.length ? (
                  history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setQuery(h);
                        setPanel("search");
                      }}
                    >
                      <strong>{h.name}</strong>
                      <span>
                        {[h.all, h.exact, h.author].filter(Boolean).join(" · ")}
                      </span>
                      <small>
                        {new Date(h.searchedAt).toLocaleString("zh-TW")}
                      </small>
                    </button>
                  ))
                ) : (
                  <Empty
                    icon={<History />}
                    title="尚無搜尋紀錄"
                    text="執行第一個 Scholar 查詢後會保存在這裡。"
                  />
                )}
              </div>
            )}
          </aside>
          <main id="results">
            <section className="intro">
              <div>
                <p className="kicker">Google Scholar research workflow</p>
                <h2>從查詢到可分析的文獻清單</h2>
                <p>
                  使用左側條件建立精準搜尋，將 Scholar 或 Publish or Perish
                  匯出檔匯入，再排序、篩選與分析引用。
                </p>
              </div>
              <div className="workflow">
                <span>
                  <b>1</b>建立查詢
                </span>
                <i></i>
                <span>
                  <b>2</b>Scholar 搜尋
                </span>
                <i></i>
                <span>
                  <b>3</b>匯入分析
                </span>
              </div>
            </section>
            <section className="metrics" aria-label="引用摘要">
              <Metric label="文獻" value={stats.papers} />
              <Metric label="總引用" value={stats.total.toLocaleString()} />
              <Metric label="每年引用" value={stats.perYear.toFixed(1)} />
              <Metric label="h-index" value={stats.h} />
              <Metric label="g-index" value={stats.g} />
            </section>
            <section className="results">
              <div className="results-head">
                <div>
                  <h2>搜尋結果</h2>
                  <span>
                    {shown.length} / {total || results.length} 筆
                  </span>
                </div>
                <div className="tools">
                  {selected > 0 && (
                    <>
                      <span className="selected">已選 {selected}</span>
                      <button
                        className="import-button"
                        onClick={() =>
                          importPapers(
                            results.filter((p) => p.selected),
                            "",
                          )
                        }
                      >
                        <ArrowDownToLine size={16} />
                        快速導入
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          setImportItems(results.filter((p) => p.selected))
                        }
                      >
                        <FolderInput size={16} />
                        選擇資料夾
                      </button>
                      <button className="danger" onClick={remove}>
                        <Trash2 size={16} />
                        移除
                      </button>
                    </>
                  )}
                  <label className="filter">
                    <Search size={16} />
                    <span className="sr">篩選結果</span>
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="篩選標題、作者、來源…"
                    />
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    aria-label="排序"
                  >
                    <option value="citations">引用數排序</option>
                    <option value="year">年份排序</option>
                    <option value="title">標題排序</option>
                  </select>
                  <button
                    className="icon"
                    aria-label={compact ? "切換舒適密度" : "切換緊湊密度"}
                    title={compact ? "舒適密度" : "緊湊密度"}
                    onClick={() => setCompact(!compact)}
                  >
                    <Filter size={17} />
                  </button>
                </div>
              </div>
              {results.length ? (
                <div className={`table-wrap ${compact ? "compact" : ""}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className="check">
                          <input
                            type="checkbox"
                            aria-label="全選結果"
                            checked={
                              results.length > 0 &&
                              results.every((p) => p.selected)
                            }
                            onChange={(e) =>
                              setResults((p) =>
                                p.map((x) => ({
                                  ...x,
                                  selected: e.target.checked,
                                })),
                              )
                            }
                          />
                        </th>
                        <th>文獻</th>
                        <th>年份</th>
                        <th>出版來源</th>
                        <th className="number">引用</th>
                        <th>
                          <span className="sr">操作</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((p) => (
                        <tr key={p.id}>
                          <td className="check">
                            <input
                              type="checkbox"
                              aria-label={`選取 ${p.title}`}
                              checked={!!p.selected}
                              onChange={(e) =>
                                setResults((old) =>
                                  old.map((x) =>
                                    x.id === p.id
                                      ? { ...x, selected: e.target.checked }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td>
                            <strong>{p.title}</strong>
                            <span>{p.authors.join("、") || "作者未提供"}</span>
                            {p.doi && <small>{p.doi}</small>}
                          </td>
                          <td>{p.year || "—"}</td>
                          <td>{p.publication || "—"}</td>
                          <td className="number">
                            <b>{p.citations.toLocaleString()}</b>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="row-import"
                                onClick={() => importPapers([p], "")}
                                disabled={papers.some(
                                  (x) => (x.doi || x.id) === (p.doi || p.id),
                                )}
                              >
                                {papers.some(
                                  (x) => (x.doi || x.id) === (p.doi || p.id),
                                ) ? (
                                  <>
                                    <Check size={15} />
                                    已導入
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownToLine size={15} />
                                    快速導入
                                  </>
                                )}
                              </button>
                              {!papers.some(
                                (x) => (x.doi || x.id) === (p.doi || p.id),
                              ) && (
                                <button
                                  className="icon"
                                  onClick={() => setImportItems([p])}
                                  aria-label={`將 ${p.title} 導入指定資料夾`}
                                  title="選擇資料夾"
                                >
                                  <FolderInput size={16} />
                                </button>
                              )}
                              <button
                                className="icon"
                                onClick={() => setCopyPaper(p)}
                                aria-label={`選擇 ${p.title} 的引用格式`}
                                title="複製引用"
                              >
                                <Clipboard size={16} />
                              </button>
                              {p.url && (
                                <a
                                  className="icon"
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`開啟 ${p.title}`}
                                  title="開啟來源"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  icon={<Library />}
                  title="尚無搜尋結果"
                  text="輸入關鍵字搜尋研究，結果會暫存在這裡，按下導入才會加入文獻庫。"
                  action={
                    <>
                      <button
                        className="secondary"
                        onClick={() => file.current?.click()}
                      >
                        <ArrowDownToLine size={17} />
                        匯入結果檔
                      </button>
                      <button
                        className="text"
                        onClick={() => {
                          setResults(demo);
                          setNotice("已載入 3 筆合成示範資料");
                        }}
                      >
                        載入合成示範
                      </button>
                    </>
                  }
                />
              )}
              {cursor && results.length > 0 && results.length < total && (
                <div className="load-more">
                  <button
                    className="secondary"
                    onClick={() => searchOnline(true)}
                    disabled={loading}
                  >
                    {loading ? "載入中…" : "載入更多研究"}
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      )}
      <input
        ref={file}
        hidden
        type="file"
        accept=".csv,.bib,.bibtex,.ris,text/csv"
        onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
      />
      {importItems.length > 0 && (
        <Modal title="導入至資料夾" onClose={() => setImportItems([])}>
          <p>將 {importItems.length} 篇文獻加入我的文獻，並選擇收藏位置。</p>
          <label>
            資料夾
            <select
              value={importFolder}
              onChange={(e) => setImportFolder(e.target.value)}
              autoFocus
            >
              <option value="">未分類（我的文獻）</option>
              {collections.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setImportItems([])}>
              取消
            </button>
            <button
              className="primary"
              onClick={() => {
                importPapers(importItems, importFolder);
                setImportItems([]);
              }}
            >
              <ArrowDownToLine size={16} />
              導入
            </button>
          </div>
        </Modal>
      )}
      {copyPaper && (
        <Modal title="複製引用" onClose={() => setCopyPaper(undefined)}>
          <p className="citation-title">{copyPaper.title}</p>
          <div className="format-list">
            {(
              ["bibtex", "apa", "mla", "chicago", "ris"] as CitationFormat[]
            ).map((format, i) => (
              <button
                key={format}
                autoFocus={i === 0}
                onClick={() => copyCitation(copyPaper, format)}
              >
                <span>
                  {format === "bibtex" ? "BibTeX" : format.toUpperCase()}
                </span>
                <small>
                  {format === "ris"
                    ? "RIS 交換格式"
                    : format === "bibtex"
                      ? "LaTeX 書目格式"
                      : "格式化引用文字"}
                </small>
                <Clipboard size={16} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button aria-label="關閉通知" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function LibraryView({
  papers,
  setPapers,
  collections,
  setCollections,
  chooseCopy,
}: {
  papers: Paper[];
  setPapers: React.Dispatch<React.SetStateAction<Paper[]>>;
  collections: string[];
  setCollections: React.Dispatch<React.SetStateAction<string[]>>;
  chooseCopy: (p: Paper) => void;
}) {
  const [collection, setCollection] = useState<string>("all");
  const [selected, setSelected] = useState<string | undefined>(papers[0]?.id);
  const [checked, setChecked] = useState<string[]>([]);
  const [moveTo, setMoveTo] = useState("");
  const [q, setQ] = useState("");
  const visible = papers.filter(
    (p) =>
      (collection === "all" || (p.collectionIds || []).includes(collection)) &&
      [p.title, p.authors.join(" "), ...(p.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const paper = papers.find((p) => p.id === selected);
  const update = (values: Partial<Paper>) =>
    setPapers((all) =>
      all.map((p) => (p.id === selected ? { ...p, ...values } : p)),
    );
  const addCollection = () => {
    const name = prompt("收藏夾名稱");
    if (name && !collections.includes(name))
      setCollections((c) => [...c, name]);
  };
  const deleteCollection = (name: string) => {
    if (!confirm(`刪除資料夾「${name}」？文獻仍會保留在我的文獻中。`)) return;
    setCollections((all) => all.filter((c) => c !== name));
    setPapers((all) =>
      all.map((p) => ({
        ...p,
        collectionIds: p.collectionIds?.filter((c) => c !== name),
      })),
    );
    setCollection("all");
  };
  const clearCollection = () => {
    if (collection === "all") {
      if (confirm("清空我的文獻庫？此操作無法復原。")) {
        setPapers([]);
        setSelected(undefined);
      }
    } else if (confirm(`清空「${collection}」？文獻仍會保留在我的文獻中。`)) {
      setPapers((all) =>
        all.map((p) => ({
          ...p,
          collectionIds: p.collectionIds?.filter((c) => c !== collection),
        })),
      );
    }
    setChecked([]);
  };
  const moveChecked = () => {
    setPapers((all) =>
      all.map((p) =>
        checked.includes(p.id)
          ? { ...p, collectionIds: moveTo ? [moveTo] : [] }
          : p,
      ),
    );
    setChecked([]);
  };
  const deleteChecked = () => {
    if (!confirm(`從文獻庫刪除 ${checked.length} 篇文獻？`)) return;
    setPapers((all) => all.filter((p) => !checked.includes(p.id)));
    if (selected && checked.includes(selected)) setSelected(undefined);
    setChecked([]);
  };
  return (
    <div className="library-layout">
      <aside className="collections">
        <h2>我的文獻庫</h2>
        <button
          className={collection === "all" ? "active" : ""}
          onClick={() => setCollection("all")}
        >
          <Library size={17} />
          所有文獻 <span>{papers.length}</span>
        </button>
        <div className="collection-title">
          <strong>收藏夾</strong>
          <button
            className="icon"
            onClick={addCollection}
            aria-label="新增收藏夾"
            title="新增收藏夾"
          >
            <Plus size={15} />
          </button>
        </div>
        {collections.map((c) => (
          <div
            className={`collection-row ${collection === c ? "active" : ""}`}
            key={c}
          >
            <button onClick={() => setCollection(c)}>
              <Folder size={17} />
              {c}
              <span>
                {papers.filter((p) => p.collectionIds?.includes(c)).length}
              </span>
            </button>
            <button
              className="collection-delete"
              onClick={() => deleteCollection(c)}
              aria-label={`刪除資料夾 ${c}`}
              title="刪除資料夾"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </aside>
      <main className="library-list">
        <header>
          <div>
            <h1>{collection === "all" ? "所有文獻" : collection}</h1>
            <span>{visible.length} 筆</span>
          </div>
          <label className="filter">
            <Search size={16} />
            <span className="sr">搜尋文獻庫</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋標題、作者、標籤…"
            />
          </label>
        </header>
        <div className="library-toolbar">
          <label>
            <input
              type="checkbox"
              checked={
                visible.length > 0 &&
                visible.every((p) => checked.includes(p.id))
              }
              onChange={(e) =>
                setChecked(e.target.checked ? visible.map((p) => p.id) : [])
              }
            />
            {checked.length ? `已選 ${checked.length}` : "全選"}
          </label>
          {checked.length > 0 && (
            <>
              <select
                value={moveTo}
                onChange={(e) => setMoveTo(e.target.value)}
                aria-label="移動至資料夾"
              >
                <option value="">未分類</option>
                {collections.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button className="secondary" onClick={moveChecked}>
                <FolderInput size={15} />
                移動
              </button>
              <button className="danger" onClick={deleteChecked}>
                <Trash2 size={15} />
                刪除
              </button>
            </>
          )}
          <button
            className="text danger-text"
            onClick={clearCollection}
            disabled={!visible.length}
          >
            清空目前位置
          </button>
        </div>
        {visible.length ? (
          <div className="library-rows">
            {visible.map((p) => (
              <div key={p.id} className={selected === p.id ? "active" : ""}>
                <input
                  type="checkbox"
                  checked={checked.includes(p.id)}
                  onChange={(e) =>
                    setChecked((all) =>
                      e.target.checked
                        ? [...all, p.id]
                        : all.filter((id) => id !== p.id),
                    )
                  }
                  aria-label={`選取 ${p.title}`}
                />
                <button onClick={() => setSelected(p.id)}>
                  <strong>{p.title}</strong>
                  <span>{p.authors.join("、") || "作者未提供"}</span>
                  <small>
                    {p.year || "—"} · {p.publication || "來源未提供"} · 引用{" "}
                    {p.citations}
                  </small>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={<Library />}
            title="這裡還沒有文獻"
            text="從研究搜尋加入結果，或切換其他收藏夾。"
          />
        )}
      </main>
      <aside className="paper-detail">
        {paper ? (
          <>
            <div className="detail-actions">
              <button className="secondary" onClick={() => chooseCopy(paper)}>
                <Clipboard size={16} />
                複製引用
              </button>
              {paper.url && (
                <a
                  className="icon"
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="開啟來源"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <h2>{paper.title}</h2>
            <p>{paper.authors.join("、") || "作者未提供"}</p>
            <dl>
              <dt>年份</dt>
              <dd>{paper.year || "未提供"}</dd>
              <dt>出版來源</dt>
              <dd>{paper.publication || "未提供"}</dd>
              <dt>DOI</dt>
              <dd>{paper.doi || "未提供"}</dd>
              <dt>引用數</dt>
              <dd>{paper.citations}</dd>
            </dl>
            <label>
              收藏夾
              <select
                value={paper.collectionIds?.[0] || ""}
                onChange={(e) =>
                  update({
                    collectionIds: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">未分類</option>
                {collections.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              標籤
              <input
                value={(paper.tags || []).join(", ")}
                onChange={(e) =>
                  update({
                    tags: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="以逗號分隔"
              />
            </label>
            <label>
              筆記
              <textarea
                value={paper.note || ""}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="記錄閱讀判斷與待辦…"
              />
            </label>
            {paper.abstract && (
              <section>
                <h3>摘要</h3>
                <p className="abstract">{paper.abstract}</p>
              </section>
            )}
          </>
        ) : (
          <Empty
            icon={<Library />}
            title="選取一篇文獻"
            text="右側會顯示書目、收藏夾、標籤和筆記。"
          />
        )}
      </aside>
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button className="icon" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
