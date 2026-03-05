"use client";

import { useDemo } from "@/lib/DemoContext";
import { getStoreInventory, getInventoryStatus, CATEGORIES } from "@/lib/demoData";

export default function StoreDashboardPage() {
  const { user } = useDemo();
  if (!user?.storeId) return null;

  const inventory = getStoreInventory(user.storeId);
  const totalItems = inventory.length;
  const criticalItems = inventory.filter((i) => getInventoryStatus(i) === "critical");
  const lowItems = inventory.filter((i) => getInventoryStatus(i) === "low");
  const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0);

  // カテゴリ別集計
  const categoryStats = CATEGORIES.map((cat) => {
    const items = inventory.filter((i) => i.category === cat);
    const total = items.reduce((s, i) => s + i.currentStock, 0);
    const alerts = items.filter((i) => getInventoryStatus(i) !== "ok").length;
    return { category: cat, totalStock: total, alertCount: alerts };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{user.storeName} ダッシュボード</h1>
        <p className="text-slate-400 text-sm mt-1">在庫状況の概要</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">管理品目数</div>
          <div className="text-3xl font-bold text-white">{totalItems}</div>
          <div className="text-slate-500 text-xs mt-1">品目</div>
        </div>
        <div className="bg-slate-800 border border-red-900/50 rounded-xl p-5">
          <div className="text-red-400 text-xs font-medium mb-1">緊急発注</div>
          <div className="text-3xl font-bold text-red-400">{criticalItems.length}</div>
          <div className="text-slate-500 text-xs mt-1">品目が発注点以下</div>
        </div>
        <div className="bg-slate-800 border border-yellow-900/50 rounded-xl p-5">
          <div className="text-yellow-400 text-xs font-medium mb-1">要注意</div>
          <div className="text-3xl font-bold text-yellow-400">{lowItems.length}</div>
          <div className="text-slate-500 text-xs mt-1">品目が在庫少</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs font-medium mb-1">在庫総額</div>
          <div className="text-2xl font-bold text-white">&yen;{totalValue.toLocaleString()}</div>
          <div className="text-slate-500 text-xs mt-1">概算</div>
        </div>
      </div>

      {/* 要対応リスト */}
      {(criticalItems.length > 0 || lowItems.length > 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">要対応アイテム</h2>
          <div className="space-y-2">
            {criticalItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-red-950/30 border border-red-900/30 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-medium text-sm">{item.partName}</span>
                  <span className="text-slate-500 text-xs ml-2">{item.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-red-400 font-bold text-sm">
                    残 {item.currentStock}{item.unit}
                  </span>
                  <span className="text-xs text-slate-500">
                    発注点: {item.reorderPoint}{item.unit}
                  </span>
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                    緊急
                  </span>
                </div>
              </div>
            ))}
            {lowItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-yellow-950/20 border border-yellow-900/20 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-medium text-sm">{item.partName}</span>
                  <span className="text-slate-500 text-xs ml-2">{item.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-yellow-400 font-bold text-sm">
                    残 {item.currentStock}{item.unit}
                  </span>
                  <span className="text-xs text-slate-500">
                    発注点: {item.reorderPoint}{item.unit}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full font-medium">
                    注意
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カテゴリ別概要 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">カテゴリ別在庫概要</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryStats.map((cs) => (
            <div key={cs.category} className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-xs mb-2">{cs.category}</div>
              <div className="text-xl font-bold text-white">{cs.totalStock}</div>
              {cs.alertCount > 0 && (
                <div className="text-red-400 text-xs mt-1">{cs.alertCount}件 要確認</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
