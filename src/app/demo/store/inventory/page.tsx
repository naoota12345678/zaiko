"use client";

import { useState } from "react";
import { useDemo } from "@/lib/DemoContext";
import { getStoreInventory, getInventoryStatus, CATEGORIES } from "@/lib/demoData";

export default function InventoryPage() {
  const { user } = useDemo();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (!user?.storeId) return null;

  const inventory = getStoreInventory(user.storeId);

  const filtered = inventory.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all" && getInventoryStatus(item) !== filterStatus) return false;
    if (search && !item.partName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusLabel = (s: string) => {
    if (s === "critical") return { text: "緊急", cls: "bg-red-600 text-white" };
    if (s === "low") return { text: "注意", cls: "bg-yellow-600 text-white" };
    return { text: "正常", cls: "bg-emerald-600/20 text-emerald-400" };
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">在庫一覧</h1>
        <p className="text-slate-400 text-sm mt-1">{user.storeName}の在庫状況</p>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="部品名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全ステータス</option>
          <option value="critical">緊急</option>
          <option value="low">注意</option>
          <option value="ok">正常</option>
        </select>
        <span className="text-slate-500 text-sm ml-auto">{filtered.length}件</span>
      </div>

      {/* テーブル */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">部品名</th>
                <th className="px-4 py-3 text-left">カテゴリ</th>
                <th className="px-4 py-3 text-right">在庫数</th>
                <th className="px-4 py-3 text-right">発注点</th>
                <th className="px-4 py-3 text-right">単価</th>
                <th className="px-4 py-3 text-right">在庫額</th>
                <th className="px-4 py-3 text-center">ステータス</th>
                <th className="px-4 py-3 text-left">最終発注日</th>
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
                    <td className="px-4 py-3 text-right text-slate-400">
                      {item.reorderPoint}<span className="text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">&yen;{item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white">&yen;{(item.currentStock * item.unitPrice).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.cls}`}>
                        {sl.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{item.lastOrderDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
