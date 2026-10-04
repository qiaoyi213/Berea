import type { Metadata } from "next";
import "./globals.css";
import "./library.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = { title: "Berea — Research search and library", description: "搜尋研究、匯入文獻並管理收藏。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
