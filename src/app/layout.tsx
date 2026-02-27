import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "レンタカー管理システム",
  description: "レンタカー業務管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ backgroundColor: "#020617" }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.style.backgroundColor='#020617';document.body&&(document.body.style.backgroundColor='#020617')` }} />
      </head>
      <body className="bg-slate-950 text-white antialiased" style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
