"use client";

import { useState } from "react";
import { useDemo } from "@/lib/DemoContext";

export default function OrdersPage() {
  const { user } = useDemo();
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!user?.storeId) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    simulateUpload();
  };

  const handleFileSelect = () => {
    simulateUpload();
  };

  const simulateUpload = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setUploaded(true);
    }, 2000);
  };

  // ダミー読み取り結果
  const dummyResult = [
    { partName: "エンジンオイル 5W-30", quantity: 40, unitPrice: 980, total: 39200 },
    { partName: "オイルフィルター", quantity: 20, unitPrice: 800, total: 16000 },
    { partName: "バッテリー 55B24L", quantity: 5, unitPrice: 8900, total: 44500 },
    { partName: "ワイパーブレード 500mm", quantity: 12, unitPrice: 1100, total: 13200 },
    { partName: "ウォッシャー液", quantity: 30, unitPrice: 300, total: 9000 },
  ];
  const totalAmount = dummyResult.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">発注PDF取込</h1>
        <p className="text-slate-400 text-sm mt-1">{user.storeName} - 発注書のPDFを取り込み在庫に反映します</p>
      </div>

      {/* アップロードエリア */}
      {!uploaded && !processing && (
        <div
          className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-950/20"
              : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="text-5xl mb-4">📄</div>
          <p className="text-white font-medium text-lg mb-2">
            発注書PDFをここにドラッグ&ドロップ
          </p>
          <p className="text-slate-400 text-sm mb-6">
            または下のボタンからファイルを選択
          </p>
          <button
            onClick={handleFileSelect}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            ファイルを選択
          </button>
          <p className="text-slate-600 text-xs mt-4">
            対応形式: PDF（デモではどのファイルでもダミー結果が表示されます）
          </p>
        </div>
      )}

      {/* 処理中 */}
      {processing && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-white font-medium text-lg">PDFを解析中...</p>
          <p className="text-slate-400 text-sm mt-2">OCRで発注内容を読み取っています</p>
        </div>
      )}

      {/* 読み取り結果 */}
      {uploaded && (
        <>
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">&#10003;</span>
            <div>
              <p className="text-emerald-400 font-medium">PDF読み取り完了</p>
              <p className="text-slate-400 text-sm">以下の発注内容を確認してください</p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-white font-bold">読み取り結果</h2>
              <span className="text-slate-400 text-sm">発注書No. PO-2026-0312</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">部品名</th>
                  <th className="px-4 py-3 text-right">数量</th>
                  <th className="px-4 py-3 text-right">単価</th>
                  <th className="px-4 py-3 text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {dummyResult.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white font-medium">{r.partName}</td>
                    <td className="px-4 py-3 text-right text-white">{r.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-400">&yen;{r.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white">&yen;{r.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 font-bold">
                  <td className="px-4 py-3 text-white" colSpan={3}>合計</td>
                  <td className="px-4 py-3 text-right text-white">&yen;{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => alert("デモ: 在庫に反映しました")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
            >
              在庫に反映する
            </button>
            <button
              onClick={() => { setUploaded(false); }}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              やり直す
            </button>
          </div>
        </>
      )}
    </div>
  );
}
