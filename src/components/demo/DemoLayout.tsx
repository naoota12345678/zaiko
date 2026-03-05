"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/DemoContext";
import DemoSidebar from "./DemoSidebar";

export default function DemoAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/demo/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <svg className="animate-spin" style={{ height: 32, width: 32, color: "#3b82f6" }} viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ color: "#64748b", fontSize: 14 }}>読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DemoSidebar />
      <main className="flex-1 bg-slate-950 overflow-auto">
        {children}
      </main>
    </div>
  );
}
