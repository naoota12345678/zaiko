"use client";

import { useState } from "react";
import { useDemo } from "@/lib/DemoContext";
import { STORES, getStoreInventory, getInventoryStatus, CATEGORIES } from "@/lib/demoData";

export default function OtherStoresPage() {
  const { user } = useDemo();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  if (!user?.storeId) return null;

  const otherStores = STORES.filter((s) => s.id !== user.storeId);

  const selectedInventory = selectedStoreId ? getStoreInventory(selectedStoreId) : [];
  const filtered = selectedInventory.filter(
    (item) => filterCategory === "all" || item.category === filterCategory
  );

  const selectedStore = STORES.find((s) => s.id === selectedStoreId);

  const statusLabel = (s: string) => {
    if (s === "critical") return { text: "緊急", cls: "bg-red-600 text-white" };
    if (s === "low") return { text: "注意", cls: "bg-yellow-600 text-white" };
    return { text: "正常", cls: "bg-emerald-600/20 text-emerald-400" };
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">他店舗在庫確認</h1>
        <p className="text-slate-400 text-sm mt-1">他店舗の在庫を確認し、移動申請ができます</p>
      </div>

      {/* 店舗選択 */}
      <div className="flex flex-wrap gap-3">
        {otherStores.map((store) => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedStoreId === store.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500"
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>

      {selectedStoreId && selectedStore && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{selectedStore.name}の在庫</h2>
            <div className="flex gap-3 items-center">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全カテゴリ</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-slate-500 text-sm">{filtered.length}件</span>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">部品名</th>
                    <th className="px-4 py-3 text-left">カテゴリ</th>
                    <th className="px-4 py-3 text-right">在庫数</th>
                    <th className="px-4 py-3 text-center">ステータス</th>
                    <th className="px-4 py-3 text-center">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filtered.map((item) => {
                    const status = getInventoryStatus(item);
                    const sl = statusLabel(status);
                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{item.partName}</td>
                        <td className="px-4 py-3 text-slate-400">{item.category}</td>
                        <td className={`px-4 py-3 text-right font-bold ${
                          status === "critical" ? "text-red-400" : status === "low" ? "text-yellow-400" : "text-white"
                        }`}>
                          {item.currentStock}<span className="text-slate-500 font-normal text-xs ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.cls}`}>
                            {sl.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status === "ok" && item.currentStock > item.reorderPoint * 2 && (
                            <button
                              onClick={() => alert(`デモ: ${selectedStore.name}から${user.storeName}への移動申請を作成しました\n部品: ${item.partName}`)}
                              className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition"
                            >
                              移動申請
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedStoreId && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-16 text-center">
          <div className="text-4xl mb-4">🏪</div>
          <p className="text-slate-400">上の店舗名をクリックして在庫を確認してください</p>
        </div>
      )}
    </div>
  );
}
