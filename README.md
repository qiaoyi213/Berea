# Berea

Publish or Perish 風格的研究搜尋與 Zotero 式文獻管理工具。

## 啟動

```bash
npm install
npm run dev
```

開啟 <http://127.0.0.1:3000>。

## 使用方式

1. 在左側輸入關鍵字、完整詞組、作者、出版來源與年份。
2. 按「搜尋相關研究」，由 OpenAlex 取得研究結果；可逐頁載入更多。
3. 每筆結果可直接複製 BibTeX，或開啟來源核對。
4. 進入「我的文獻庫」，用收藏夾、標籤與筆記管理文獻。
5. 也可到 Google Scholar 原生搜尋，或匯入 Scholar／Publish or Perish 的 CSV、BibTeX、RIS。

搜尋紀錄、暫存結果與已導入文獻保存在瀏覽器 `localStorage`。搜尋結果只有按下「導入」後才會進入全部文獻；清除網站資料會一併清除，重要結果請匯出 CSV。

## 合規邊界

Google Scholar 沒有公開的批次搜尋 API。Berea 不爬取 Scholar、不繞過 CAPTCHA、不偽造 API，也不在背景自動送出大量請求。頁內搜尋明確使用 OpenAlex API；Google Scholar 用於原生搜尋與核對。

CSV 支援 Publish or Perish 常見的 `Title`、`Authors`、`Year`、`DOI`、`Citations`／`Cites`、`Publication` 等欄位。BibTeX 與 RIS 使用 Citation.js 解析。

## 指標

- 文獻數與總引用
- 每年引用：以匯入文獻中最早年份至今年的跨度估算
- h-index
- g-index

不同來源與擷取時間可能產生不同引用數；本工具不把結果視為即時或權威書目資料。

## 驗證

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
