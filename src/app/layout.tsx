import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WOW Growth Platform",
  description: "정부지원사업 맞춤 추천 및 AI 초안 생성 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
