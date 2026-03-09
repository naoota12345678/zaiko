"use client";

import { useState, useRef } from "react";
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
  status: "waiting" | "checking" | "skipped" | "running" | "done" | "error";
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
  const [hasWarning, setHasWarning] = useState(false);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const updateStep = (index: number, updates: Partial<SeedStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  // ボタン1つ: 自動で既存チェック → 空のコレクションのみ投入
  const handleSeed = async () => {
    setIsRunning(true);
    setIsDone(false);
    setHasWarning(false);

    let hasExisting = false;

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      const step = INITIAL_STEPS[i];

      // 1. 既存データチェック
      updateStep(i, { status: "checking" });
      try {
        const ref = collection(db, step.collectionName);
        const snapshot = await getDocs(ref);
        const existingCount = snapshot.size;

        if (existingCount > 0) {
          // 既存データあり → スキップ
          updateStep(i, { status: "skipped", existingCount });
          hasExisting = true;
          continue;
        }
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "確認に失敗しました",
        });
        continue;
      }

      // 2. データ投入
      updateStep(i, { status: "running" });
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cleanedData = step.data.map(({ id, ...rest }) => rest);
        await batchAddDocuments(step.collectionName, cleanedData);
        updateStep(i, { status: "done", count: cleanedData.length });
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "投入に失敗しました",
        });
      }
    }

    setHasWarning(hasExisting);
    setIsRunning(false);
    setIsDone(true);
  };

  const getStatusIcon = (status: SeedStep["status"]) => {
    switch (status) {
      case "waiting": return "⏳";
      case "checking": return "🔍";
      case "skipped": return "⏭️";
      case "running": return "⏳";
      case "done": return "✅";
      case "error": return "❌";
    }
  };

  const getStatusColor = (status: SeedStep["status"]) => {
    switch (status) {
      case "waiting": return "text-slate-500";
      case "checking": return "text-blue-400 animate-pulse";
      case "skipped": return "text-yellow-400";
      case "running": return "text-blue-400 animate-pulse";
      case "done": return "text-emerald-400";
      case "error": return "text-red-400";
    }
  };

  const getStatusText = (step: SeedStep) => {
    switch (step.status) {
      case "waiting": return "待機中";
      case "checking": return "確認中...";
      case "skipped": return `スキップ (既存${step.existingCount}件)`;
      case "running": return "投入中...";
      case "done": return `完了 (${step.count}件投入)`;
      case "error": return step.error ?? "エラー";
    }
  };

  const doneCount = steps.filter((s) => s.status === "done").length;
  const skippedCount = steps.filter((s) => s.status === "skipped").length;
  const errorCount = steps.filter((s) => s.status === "error").length;

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
          {!isDone && (
            <button
              onClick={handleSeed}
              disabled={isRunning}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors text-lg"
            >
              {isRunning ? "処理中..." : "データを投入する"}
            </button>
          )}

          {isDone && (
            <>
              <div className={`${hasWarning ? "bg-yellow-900/30 border-yellow-700/50" : "bg-emerald-900/30 border-emerald-700/50"} border rounded-lg p-4 text-center`}>
                <p className={`${hasWarning ? "text-yellow-400" : "text-emerald-400"} font-medium`}>
                  処理が完了しました
                </p>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  {doneCount > 0 && (
                    <span className="text-emerald-400">投入: {doneCount}件</span>
                  )}
                  {skippedCount > 0 && (
                    <span className="text-yellow-400">スキップ: {skippedCount}件</span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-400">エラー: {errorCount}件</span>
                  )}
                </div>
                {hasWarning && (
                  <p className="text-yellow-400/70 text-xs mt-2">
                    既存データがあるコレクションはスキップしました
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSteps(INITIAL_STEPS.map((s) => ({ ...s })));
                  setIsDone(false);
                  setHasWarning(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
              >
                リセット
              </button>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          /demo/admin/seed
        </p>
      </div>
    </div>
  );
}
