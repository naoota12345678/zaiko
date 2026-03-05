"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDemoUser } from "@/lib/demoAuth";

export default function DemoIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getDemoUser();
    if (user) {
      router.push(user.role === "hq" ? "/demo/hq/summary" : "/demo/store/dashboard");
    } else {
      router.push("/demo/login");
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#64748b", fontSize: 14 }}>リダイレクト中...</div>
    </div>
  );
}
