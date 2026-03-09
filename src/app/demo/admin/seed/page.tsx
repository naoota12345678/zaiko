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

type StepStatus = "waiting" | "checking" | "skipped" | "running" | "done" | "error";

interface SeedStep {
  label: string;
  collectionName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  status: StepStatus;
  count?: number;
  existingCount?: number;
  error?: string;
}

const SEED_CONFIG: { label: string; collectionName: string; data: unknown[] }[] = [
  { label: "店舗マスタ", collectionName: COLLECTIONS.stores, data: STORES },
  { label: "カテゴリマスタ", collectionName: COLLECTIONS.categories, data: CATEGORIES },
  { label: "単位マスタ", collectionName: COLLECTIONS.units, data: UNITS },
  { label: "仕入先マスタ", collectionName: COLLECTIONS.suppliers, data: SUPPLIERS },
  { label: "商品マスタ", collectionName: COLLECTIONS.products, data: PRODUCTS },
  { label: "発注ルール", collectionName: COLLECTIONS.orderRules, data: ORDER_RULES },
  { label: "在庫データ", collectionName: COLLECTIONS.inventory, data: ALL_INVENTORY },
  { label: "発注書", collectionName: COLLECTIONS.purchaseOrders, data: PURCHASE_ORDERS },
  { label: "入荷記録", collectionName: COLLECTIONS.receivings, data: RECEIVING_RECORDS },
  { label: "出荷記録", collectionName: COLLECTIONS.shipments, data: SHIPMENT_RECORDS },
  { label: "棚卸し記録", collectionName: COLLECTIONS.stocktakings, data: STOCKTAKING_RECORDS },
  { label: "入出荷履歴", collectionName: COLLECTIONS.transactions, data: TRANSACTION_LOGS },
  { label: "移動申請", collectionName: COLLECTIONS.transfers, data: TRANSFER_REQUESTS },
  { label: "月別コスト", collectionName: COLLECTIONS.monthlyCosts, data: MONTHLY_COSTS },
];

export default function SeedPage() {
  const [phase, setPhase] = useState<"ready" | "running" | "done">("ready");
  const [steps, setSteps] = useState<SeedStep[]>([]);
  const [summary, setSummary] = useState({ done: 0, skipped: 0, errors: 0 });

  const updateStep = (index: number, updates: Partial<SeedStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleSeed = async () => {
    // 初期化
    const initialSteps: SeedStep[] = SEED_CONFIG.map((c) => ({
      ...c,
      status: "waiting" as StepStatus,
    }));
    setSteps(initialSteps);
    setPhase("running");

    let doneCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < SEED_CONFIG.length; i++) {
      const config = SEED_CONFIG[i];

      // 1. 既存データチェック
      updateStep(i, { status: "checking" });
      try {
        const ref = collection(db, config.collectionName);
        const snapshot = await getDocs(ref);

        if (snapshot.size > 0) {
          updateStep(i, { status: "skipped", existingCount: snapshot.size });
          skippedCount++;
          continue;
        }
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "確認失敗",
        });
        errorCount++;
        continue;
      }

      // 2. データ投入
      updateStep(i, { status: "running" });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cleanedData = config.data.map((item: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = item;
          return rest;
        });
        await batchAddDocuments(config.collectionName, cleanedData);
        updateStep(i, { status: "done", count: cleanedData.length });
        doneCount++;
      } catch (err) {
        updateStep(i, {
          status: "error",
          error: err instanceof Error ? err.message : "投入失敗",
        });
        errorCount++;
      }
    }

    setSummary({ done: doneCount, skipped: skippedCount, errors: errorCount });
    setPhase("done");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* ===== 初期画面: ボタンだけ ===== */}
        {phase === "ready" && (
          <div className="text-center">
            <div className="mb-8">
              <div className="text-5xl mb-4">&#128451;</div>
              <h1 className="text-2xl font-bold mb-3">初期データ投入</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                デモ用データ（14コレクション）を<br />
                Firestore（sizukaproduct）に一括登録します。
              </p>
              <p className="text-slate-500 text-xs mt-2">
                既にデータがあるコレクションは自動でスキップします。
              </p>
            </div>
            <button
              onClick={handleSeed}
              className="w-full max-w-xs mx-auto py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-lg shadow-lg shadow-emerald-900/30"
            >
              データを投入する
            </button>
          </div>
        )}

        {/* ===== 実行中: 進捗表示 ===== */}
        {phase === "running" && (
          <div>
            <h1 className="text-xl font-bold text-center mb-6">投入中...</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {steps.map((step, i) => (
                <div
                  key={step.collectionName}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i < steps.length - 1 ? "border-b border-slate-800/50" : ""
                  }`}
                >
                  <span className="text-sm">{step.label}</span>
                  <span className={`text-xs ${
                    step.status === "waiting" ? "text-slate-600" :
                    step.status === "checking" ? "text-blue-400 animate-pulse" :
                    step.status === "running" ? "text-blue-400 animate-pulse" :
                    step.status === "skipped" ? "text-yellow-400" :
                    step.status === "done" ? "text-emerald-400" :
                    "text-red-400"
                  }`}>
                    {step.status === "waiting" && "待機中"}
                    {step.status === "checking" && "確認中..."}
                    {step.status === "running" && "投入中..."}
                    {step.status === "skipped" && `スキップ(既存${step.existingCount}件)`}
                    {step.status === "done" && `完了(${step.count}件)`}
                    {step.status === "error" && step.error}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 完了画面 ===== */}
        {phase === "done" && (
          <div className="text-center">
            <div className="text-5xl mb-4">
              {summary.errors > 0 ? "⚠️" : "✅"}
            </div>
            <h1 className="text-2xl font-bold mb-4">完了</h1>

            <div className="flex justify-center gap-6 mb-6">
              {summary.done > 0 && (
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{summary.done}</div>
                  <div className="text-xs text-slate-500">投入</div>
                </div>
              )}
              {summary.skipped > 0 && (
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{summary.skipped}</div>
                  <div className="text-xs text-slate-500">スキップ</div>
                </div>
              )}
              {summary.errors > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-400">{summary.errors}</div>
                  <div className="text-xs text-slate-500">エラー</div>
                </div>
              )}
            </div>

            {/* 詳細 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 text-left">
              {steps.map((step, i) => (
                <div
                  key={step.collectionName}
                  className={`flex items-center justify-between px-4 py-2 ${
                    i < steps.length - 1 ? "border-b border-slate-800/50" : ""
                  }`}
                >
                  <span className="text-sm">{step.label}</span>
                  <span className={`text-xs ${
                    step.status === "skipped" ? "text-yellow-400" :
                    step.status === "done" ? "text-emerald-400" :
                    "text-red-400"
                  }`}>
                    {step.status === "skipped" && `既存${step.existingCount}件`}
                    {step.status === "done" && `${step.count}件投入`}
                    {step.status === "error" && step.error}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("ready")}
              className="py-2.5 px-8 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
