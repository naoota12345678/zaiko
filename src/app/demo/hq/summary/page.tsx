"use client";

import { STORES, getStoreInventory, getInventoryStatus } from "@/lib/demoData";

export default function HQSummaryPage() {
  const storeStats = STORES.map((store) => {
    const inventory = getStoreInventory(store.id);
    const totalItems = inventory.length;
    const critical = inventory.filter((i) => getInventoryStatus(i) === "critical").length;
    const low = inventory.filter((i) => getInventoryStatus(i) === "low").length;
    const ok = totalItems - critical - low;
    const totalValue = inventory.reduce((s, i) => s + i.currentStock * i.unitPrice, 0);
    return { ...store, totalItems, critical, low, ok, totalValue };
  });

  const totalCritical = storeStats.reduce((s, st) => s + st.critical, 0);
  const totalLow = storeStats.reduce((s, st) => s + st.low, 0);
  const grandTotal = storeStats.reduce((s, st) => s + st.totalValue, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">全店舗 在庫サマリー</h1>
        <p className="text-slate-400 text-sm mt-1">全{STORES.length}店舗の在庫状況を一覧で確認</p>
      </div>

      {/* 全体サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-red-900/50 rounded-xl p-5">
          <div className="text-red-400 text-xs font-medium mb-1">緊急発注（全店舗計）</div>
          <div className="text-3xl font-bold text-red-400">{totalCritical}</div>
          <div className="text-slate-500 text-xs mt-1">品目</div>
        </div>
        <div className="bg-slate-800 border border-yellow-900/50 rounded-xl p-5">
          <div className="text-yellow-400 text-xs font-medium mb-1">要注意（全店舗計）</div>
          <div className="text-3xl font-bold text-yellow-400">{totalLow}</div>
          <div className="text-slate-500 text-xs mt-1">品目</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">在庫総額（全店舗計）</div>
          <div className="text-2xl font-bold text-white">&yen;{grandTotal.toLocaleString()}</div>
          <div className="text-slate-500 text-xs mt-1">概算</div>
        </div>
      </div>

      {/* 店舗別カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {storeStats.map((store) => (
          <div key={store.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg">{store.name}</h3>
              {store.critical > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                  {store.critical}件 緊急
                </span>
              )}
            </div>
            <div className="text-slate-500 text-xs mb-3">{store.area}</div>

            {/* バー */}
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-900 mb-3">
              <div className="bg-emerald-500" style={{ width: `${(store.ok / store.totalItems) * 100}%` }} />
              <div className="bg-yellow-500" style={{ width: `${(store.low / store.totalItems) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(store.critical / store.totalItems) * 100}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-emerald-400 font-bold">{store.ok}</div>
                <div className="text-slate-500">正常</div>
              </div>
              <div>
                <div className="text-yellow-400 font-bold">{store.low}</div>
                <div className="text-slate-500">注意</div>
              </div>
              <div>
                <div className="text-red-400 font-bold">{store.critical}</div>
                <div className="text-slate-500">緊急</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700 text-right">
              <span className="text-slate-400 text-xs">在庫額 </span>
              <span className="text-white text-sm font-bold">&yen;{store.totalValue.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
