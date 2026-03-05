"use client";

import { useState } from "react";
import { STORES, MONTHLY_COSTS } from "@/lib/demoData";

export default function CostsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const months = [...new Set(MONTHLY_COSTS.map((c) => c.month))].sort();

  // 店舗別の月別コスト集計
  const storeMonthlyData = STORES.map((store) => {
    const costs = MONTHLY_COSTS.filter((c) => c.storeId === store.id);
    const total = costs.reduce((s, c) => s + c.totalCost, 0);
    return { store, costs, total };
  });

  // 月別の全店舗合計
  const monthlyTotals = months.map((month) => {
    const total = MONTHLY_COSTS.filter((c) => c.month === month).reduce((s, c) => s + c.totalCost, 0);
    return { month, total };
  });

  const grandTotal = MONTHLY_COSTS.reduce((s, c) => s + c.totalCost, 0);
  const maxMonthlyTotal = Math.max(...monthlyTotals.map((m) => m.total));
  const maxStoreTotal = Math.max(...storeMonthlyData.map((s) => s.total));

  // 選択月のデータ
  const selectedMonthData = selectedMonth === "all"
    ? storeMonthlyData.map((sd) => ({
        storeName: sd.store.name,
        cost: sd.total,
      }))
    : STORES.map((store) => {
        const cost = MONTHLY_COSTS.find((c) => c.storeId === store.id && c.month === selectedMonth);
        return { storeName: store.name, cost: cost?.totalCost ?? 0 };
      });

  const selectedMax = Math.max(...selectedMonthData.map((d) => d.cost));

  const storeColors = [
    "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
    "bg-cyan-500", "bg-pink-500", "bg-amber-500", "bg-indigo-500",
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">仕入れコスト集計</h1>
        <p className="text-slate-400 text-sm mt-1">店舗別・月別の仕入れコストを確認</p>
      </div>

      {/* 全体サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">6ヶ月合計</div>
          <div className="text-2xl font-bold text-white">&yen;{grandTotal.toLocaleString()}</div>
          <div className="text-slate-500 text-xs mt-1">全{STORES.length}店舗</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">月平均</div>
          <div className="text-2xl font-bold text-white">&yen;{Math.round(grandTotal / months.length).toLocaleString()}</div>
          <div className="text-slate-500 text-xs mt-1">全店舗計</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">店舗平均</div>
          <div className="text-2xl font-bold text-white">&yen;{Math.round(grandTotal / STORES.length / months.length).toLocaleString()}</div>
          <div className="text-slate-500 text-xs mt-1">月あたり</div>
        </div>
      </div>

      {/* 月別推移グラフ */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">月別コスト推移（全店舗合計）</h2>
        <div className="flex items-end gap-3 h-48">
          {monthlyTotals.map((mt) => (
            <div key={mt.month} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="text-white text-xs font-bold mb-1">
                &yen;{Math.round(mt.total / 10000)}万
              </div>
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
                style={{ height: `${(mt.total / maxMonthlyTotal) * 80}%`, minHeight: 4 }}
              />
              <div className="text-slate-500 text-xs mt-2">{mt.month.slice(5)}月</div>
            </div>
          ))}
        </div>
      </div>

      {/* 店舗別グラフ */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">店舗別コスト</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">6ヶ月合計</option>
            {months.map((m) => (
              <option key={m} value={m}>{m.replace("-", "年")}月</option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {selectedMonthData.map((d, i) => (
            <div key={d.storeName} className="flex items-center gap-3">
              <div className="w-20 text-sm text-slate-300 text-right shrink-0">{d.storeName}</div>
              <div className="flex-1 bg-slate-900 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full rounded-full ${storeColors[i]} transition-all duration-500`}
                  style={{ width: `${(d.cost / selectedMax) * 100}%`, minWidth: 4 }}
                />
              </div>
              <div className="w-28 text-sm text-white font-bold text-right shrink-0">
                &yen;{d.cost.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="text-white font-bold">月別詳細</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">店舗</th>
                {months.map((m) => (
                  <th key={m} className="px-4 py-3 text-right">{m.slice(5)}月</th>
                ))}
                <th className="px-4 py-3 text-right">合計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {storeMonthlyData.map((sd) => (
                <tr key={sd.store.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-white font-medium">{sd.store.name}</td>
                  {months.map((month) => {
                    const cost = sd.costs.find((c) => c.month === month);
                    return (
                      <td key={month} className="px-4 py-3 text-right text-slate-300">
                        &yen;{(cost?.totalCost ?? 0).toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-white font-bold">
                    &yen;{sd.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 font-bold">
                <td className="px-4 py-3 text-white">合計</td>
                {months.map((month) => {
                  const total = monthlyTotals.find((m) => m.month === month)?.total ?? 0;
                  return (
                    <td key={month} className="px-4 py-3 text-right text-white">
                      &yen;{total.toLocaleString()}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right text-white">&yen;{grandTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
