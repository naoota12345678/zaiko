"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, batchAddDocuments } from "@/lib/inventoryFirestore";
import {
  STORES,
  CATEGORIES,
  UNITS,
  SUPPLIERS,
  PRODUCTS,
  ORDER_RULES,
  ALL_INVENTORY,
  PURCHASE_ORDERS,
  RECEIVING_RECORDS,
  SHIPMENT_RECORDS,
  STOCKTAKING_RECORDS,
  TRANSACTION_LOGS,
  TRANSFER_REQUESTS,
  MONTHLY_COSTS,
} from "@/lib/demoData";

interface SeedStep {
  label: string;
  collectionName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  status: "waiting" | "checking" | "exists" | "running" | "done" | "error";
  count?: number;
  existingCount?: number;
  error?: string;
}

const INITIAL_STEPS: SeedStep[] = [
  { label: "店舗マスタ", collectionName: COLLECTIONS.stores, data: STORES, status: "waiting" },
  { label: "カテゴリマスタ", collectionName: COLLECTIONS.categories, data: CATEGORIES, status: "waiting" },
  { label: "単位マスタ", collectionName: COLLECTIONS.units, data: UNITS, status: "waiting" },
  { label: "仕入先マスタ", collectionName: COLLECTIONS.suppliers, data: SUPPLIERS, status: "waiting" },
  { label: "商品マスタ", collectionName: COLLECTIONS.products, data: PRODUCTS, status: "waiting" },
  { label: "発注ルール", collectionName: COLLECTIONS.orderRules, data: ORDER_RULES, status: "waiting" },
  { label: "在庫データ", collectionName: COLLECTIONS.inventory, data: ALL_INVENTORY, status: "waiting" },
  { label: "発注書", collectionName: COLLECTIONS.purchaseOrders, data: PURCHASE_ORDERS, status: "waiting" },
  { label: "入荷記録", collectionName: COLLECTIONS.receivings, data: RECEIVING_RECORDS, status: "waiting" },
  { label: "出荷記録", collectionName: COLLECTIONS.shipments, data: SHIPMENT_RECORDS, status: "waiting" },
  { label: "棚卸し記録", collectionName: COLLECTIONS.stocktakings, data: STOCKTAKING_RECORDS, status: "waiting" },
  { label: "入出荷履歴", collectionName: COLLECTIONS.transactions, data: TRANSACTION_LOGS, status: "waiting" },
  { label: "移動申請", collectionName: COLLECTIONS.transfers, data: TRANSFER_REQUESTS, status: "waiting" },
  { label: "月別コスト", collectionName: COLLECTIONS.monthlyCosts, data: MONTHLY_COSTS, status: "waiting" },
];

export default function SeedPage() {
  const [steps, setSteps] = useState<SeedStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [mode, setMode] = useState<"check" | "seed" | null>(null);

  const updateStep = (index: number, updates: Partial<SeedStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  // 既存データを確認
  const handleCheck = async () => {
    setIsRunning(true);
    setMode("check");
    setIsDone(false);

    for (let i = 0; i < steps.length; i++) {
      updateStep(i, { status: "checking" });
      try {
        const ref = collection(db, steps[i].collectionName);
        const snapshot = await getDocs(ref);
        const count = snapshot.size;
        updateStep(i, {
          status: count > 0 ? "exists" : "done",
          existingCount: count,
        });
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "確認に失敗しました",
        });
      }
    }

    setIsRunning(false);
    setIsDone(true);
  };

  // データ投入
  const handleSeed = async (skipExisting: boolean) => {
    setIsRunning(true);
    setMode("seed");
    setIsDone(false);

    for (let i = 0; i < steps.length; i++) {
      // 既存データがあってスキップする場合
      if (skipExisting && steps[i].existingCount && steps[i].existingCount! > 0) {
        updateStep(i, { status: "exists" });
        continue;
      }

      updateStep(i, { status: "running" });
      try {
        // idフィールドを除外してFirestoreに投入
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cleanedData = steps[i].data.map(({ id, ...rest }) => rest);
        await batchAddDocuments(steps[i].collectionName, cleanedData);
        updateStep(i, { status: "done", count: cleanedData.length });
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "投入に失敗しました",
        });
      }
    }

    setIsRunning(false);
    setIsDone(true);
  };

  const hasExisting = steps.some((s) => s.existingCount && s.existingCount > 0);
  const allChecked = steps.every((s) => s.status !== "waiting");

  const getStatusIcon = (status: SeedStep["status"]) => {
    switch (status) {
      case "waiting": return "⏳";
      case "checking": return "🔍";
      case "exists": return "⚠️";
      case "running": return "⏳";
      case "done": return "✅";
      case "error": return "❌";
    }
  };

  const getStatusColor = (status: SeedStep["status"]) => {
    switch (status) {
      case "waiting": return "text-slate-500";
      case "checking": return "text-blue-400 animate-pulse";
      case "exists": return "text-yellow-400";
      case "running": return "text-blue-400 animate-pulse";
      case "done": return "text-emerald-400";
      case "error": return "text-red-400";
    }
  };

  const getStatusText = (step: SeedStep) => {
    switch (step.status) {
      case "waiting": return "待機中";
      case "checking": return "確認中...";
      case "exists": return `既存データあり (${step.existingCount}件)`;
      case "running": return "投入中...";
      case "done":
        if (mode === "check") return step.existingCount === 0 ? "データなし" : `${step.existingCount}件`;
        return `完了 (${step.count}件投入)`;
      case "error": return step.error ?? "エラー";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">初期データ投入</h1>
          <p className="text-slate-400 text-sm">
            Firestoreにデモデータを一括登録します
          </p>
        </div>

        {/* ステップ一覧 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 px-5 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium">
            <span></span>
            <span>コレクション</span>
            <span className="text-right">ステータス</span>
          </div>
          {steps.map((step, i) => (
            <div
              key={step.collectionName}
              className={`grid grid-cols-[auto_1fr_auto] gap-x-4 px-5 py-3 items-center ${
                i < steps.length - 1 ? "border-b border-slate-800/50" : ""
              }`}
            >
              <span className="text-lg">{getStatusIcon(step.status)}</span>
              <div>
                <span className="text-sm font-medium">{step.label}</span>
                <span className="text-xs text-slate-600 ml-2">
                  {step.collectionName} ({step.data.length}件)
                </span>
              </div>
              <span className={`text-xs text-right ${getStatusColor(step.status)}`}>
                {getStatusText(step)}
              </span>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3">
          {!allChecked && (
            <button
              onClick={handleCheck}
              disabled={isRunning}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
            >
              {isRunning ? "確認中..." : "既存データを確認する"}
            </button>
          )}

          {allChecked && !isDone && !isRunning && (
            <>
              {hasExisting ? (
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-2">
                  <p className="text-yellow-400 text-sm font-medium mb-2">
                    既存データが検出されました
                  </p>
                  <p className="text-yellow-400/70 text-xs mb-3">
                    既存データを残して空のコレクションのみに投入するか、全コレクションに上書き投入するか選択してください。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSeed(true)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      空のみ投入
                    </button>
                    <button
                      onClick={() => handleSeed(false)}
                      className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      全て投入（重複あり）
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSeed(false)}
                  disabled={isRunning}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  データを投入する
                </button>
              )}
            </>
          )}

          {isDone && mode === "seed" && (
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 text-center">
              <p className="text-emerald-400 font-medium">データ投入が完了しました</p>
              <p className="text-emerald-400/70 text-xs mt-1">
                Firestoreコンソールで確認できます
              </p>
            </div>
          )}

          {isDone && (
            <button
              onClick={() => {
                setSteps(INITIAL_STEPS);
                setIsDone(false);
                setMode(null);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
            >
              リセット
            </button>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          /demo/admin/seed
        </p>
      </div>
    </div>
  );
}
