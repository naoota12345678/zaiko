"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/DemoContext";
import { STORES } from "@/lib/demoData";

export default function DemoLoginPage() {
  const router = useRouter();
  const { login } = useDemo();
  const [mode, setMode] = useState<"store" | "hq">("store");
  const [selectedStore, setSelectedStore] = useState(STORES[0].id);

  const handleLogin = () => {
    if (mode === "hq") {
      login({ name: "本部管理者", role: "hq", storeId: null, storeName: null });
      router.push("/demo/hq/summary");
    } else {
      const store = STORES.find((s) => s.id === selectedStore)!;
      login({ name: `${store.name} 店長`, role: "store", storeId: store.id, storeName: store.name });
      router.push("/demo/store/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4" style={{ backgroundColor: "#0f172a" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">&#9981;</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            GS在庫管理システム
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            デモ用ログイン
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          {/* モード切り替え */}
          <div className="flex mb-6 bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setMode("store")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${
                mode === "store"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              店舗ログイン
            </button>
            <button
              onClick={() => setMode("hq")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${
                mode === "hq"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              本部ログイン
            </button>
          </div>

          {mode === "store" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                店舗を選択
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {STORES.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}（{store.area}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "hq" && (
            <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <p className="text-slate-300 text-sm">
                本部管理者として全8店舗の在庫状況を確認できます。
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className={`w-full py-3 font-bold rounded-lg transition duration-200 ease-in-out text-white ${
              mode === "store"
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {mode === "store" ? "店舗画面へ" : "本部画面へ"}
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          デモ版 - データはすべてダミーです
        </p>
      </div>
    </div>
  );
}
