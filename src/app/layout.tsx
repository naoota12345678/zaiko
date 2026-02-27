import type { Metadata } from "next";
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
        <style dangerouslySetInnerHTML={{ __html: `html,body{background-color:#020617!important;color:#fff}` }} />
      </head>
      <body className="bg-slate-950 text-white antialiased" style={{ backgroundColor: "#020617", color: "#fff" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
