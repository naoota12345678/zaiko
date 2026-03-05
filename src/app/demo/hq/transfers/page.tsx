"use client";

import { useState } from "react";
import { STORES, TRANSFER_REQUESTS } from "@/lib/demoData";

export default function TransfersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const storeName = (id: string) => STORES.find((s) => s.id === id)?.name ?? id;

  const filtered = TRANSFER_REQUESTS.filter(
    (r) => filterStatus === "all" || r.status === filterStatus
  );

  const statusConfig: Record<string, { text: string; cls: string }> = {
    pending: { text: "申請中", cls: "bg-blue-600/20 text-blue-400" },
    approved: { text: "承認済", cls: "bg-emerald-600/20 text-emerald-400" },
    rejected: { text: "却下", cls: "bg-red-600/20 text-red-400" },
    completed: { text: "完了", cls: "bg-slate-600/20 text-slate-400" },
  };

  const pendingCount = TRANSFER_REQUESTS.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">店舗間移動申請一覧</h1>
          <p className="text-slate-400 text-sm mt-1">店舗間の在庫移動申請を管理</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-blue-600/20 border border-blue-800/50 rounded-lg px-4 py-2">
            <span className="text-blue-400 text-sm font-medium">{pendingCount}件 承認待ち</span>
          </div>
        )}
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "すべて" },
          { value: "pending", label: "申請中" },
          { value: "approved", label: "承認済" },
          { value: "completed", label: "完了" },
          { value: "rejected", label: "却下" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">申請日</th>
                <th className="px-4 py-3 text-left">移動元</th>
                <th className="px-4 py-3 text-center">→</th>
                <th className="px-4 py-3 text-left">移動先</th>
                <th className="px-4 py-3 text-left">部品名</th>
                <th className="px-4 py-3 text-right">数量</th>
                <th className="px-4 py-3 text-center">ステータス</th>
                <th className="px-4 py-3 text-left">備考</th>
                <th className="px-4 py-3 text-center">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((req) => {
                const sc = statusConfig[req.status];
                return (
                  <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{req.requestDate}</td>
                    <td className="px-4 py-3 text-white font-medium">{storeName(req.fromStoreId)}</td>
                    <td className="px-4 py-3 text-center text-slate-500">→</td>
                    <td className="px-4 py-3 text-white font-medium">{storeName(req.toStoreId)}</td>
                    <td className="px-4 py-3 text-white">{req.partName}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{req.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                        {sc.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-48 truncate">{req.note}</td>
                    <td className="px-4 py-3 text-center">
                      {req.status === "pending" && (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => alert("デモ: 承認しました")}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded hover:bg-emerald-600/30 transition"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => alert("デモ: 却下しました")}
                            className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded hover:bg-red-600/30 transition"
                          >
                            却下
                          </button>
                        </div>
                      )}
                    </td>
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
