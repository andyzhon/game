import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "远征",
  description: "六关冒险，挑战不同魔物，留下你的全球排行战绩。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
