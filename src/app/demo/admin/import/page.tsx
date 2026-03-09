"use client";

import { useState, useRef } from "react";
import { COLLECTIONS, batchAddDocuments } from "@/lib/inventoryFirestore";

// ============================================================
// コレクション定義
// ============================================================

interface ColumnDef {
  key: string;
  label: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  example: string;
}

interface CollectionDef {
  key: string;
  label: string;
  collectionName: string;
  columns: ColumnDef[];
}

const COLLECTIONS_DEF: CollectionDef[] = [
  {
    key: "stores",
    label: "店舗マスタ",
    collectionName: COLLECTIONS.stores,
    columns: [
      { key: "name", label: "店舗名", type: "string", required: true, example: "東京本店" },
      { key: "area", label: "エリア", type: "string", required: false, example: "東京都渋谷区" },
      { key: "postalCode", label: "郵便番号", type: "string", required: false, example: "150-0001" },
      { key: "address", label: "住所", type: "string", required: false, example: "東京都渋谷区神宮前1-1-1" },
      { key: "tel", label: "電話番号", type: "string", required: false, example: "03-1234-5678" },
      { key: "fax", label: "FAX", type: "string", required: false, example: "03-1234-5679" },
      { key: "manager", label: "責任者", type: "string", required: false, example: "山田太郎" },
      { key: "email", label: "メール", type: "string", required: false, example: "tokyo@example.com" },
      { key: "openTime", label: "営業開始", type: "string", required: false, example: "09:00" },
      { key: "closeTime", label: "営業終了", type: "string", required: false, example: "18:00" },
      { key: "regularHoliday", label: "定休日", type: "string", required: false, example: "日曜・祝日" },
    ],
  },
  {
    key: "categories",
    label: "カテゴリマスタ",
    collectionName: COLLECTIONS.categories,
    columns: [
      { key: "name", label: "カテゴリ名", type: "string", required: true, example: "犬用おやつ" },
      { key: "description", label: "説明", type: "string", required: false, example: "犬用おやつ全般" },
      { key: "sortOrder", label: "表示順", type: "number", required: false, example: "1" },
    ],
  },
  {
    key: "units",
    label: "単位マスタ",
    collectionName: COLLECTIONS.units,
    columns: [
      { key: "name", label: "単位名", type: "string", required: true, example: "個" },
      { key: "symbol", label: "記号", type: "string", required: true, example: "個" },
    ],
  },
  {
    key: "suppliers",
    label: "仕入先マスタ",
    collectionName: COLLECTIONS.suppliers,
    columns: [
      { key: "name", label: "仕入先名", type: "string", required: true, example: "株式会社ペットフーズ" },
      { key: "postalCode", label: "郵便番号", type: "string", required: false, example: "100-0001" },
      { key: "address", label: "住所", type: "string", required: false, example: "東京都千代田区1-1" },
      { key: "contact", label: "担当者", type: "string", required: false, example: "営業部 田中" },
      { key: "tel", label: "電話番号", type: "string", required: false, example: "03-9999-8888" },
      { key: "fax", label: "FAX", type: "string", required: false, example: "03-9999-8889" },
      { key: "email", label: "メール", type: "string", required: false, example: "tanaka@petfoods.co.jp" },
      { key: "bankInfo", label: "振込先", type: "string", required: false, example: "みずほ銀行 本店 普通 1234567" },
      { key: "paymentTerms", label: "支払条件", type: "string", required: false, example: "月末締め翌月末払い" },
      { key: "leadDays", label: "リードタイム(日)", type: "number", required: false, example: "3" },
      { key: "rating", label: "評価(1-5)", type: "number", required: false, example: "4" },
      { key: "memo", label: "備考", type: "string", required: false, example: "" },
    ],
  },
  {
    key: "products",
    label: "商品マスタ",
    collectionName: COLLECTIONS.products,
    columns: [
      { key: "code", label: "商品コード", type: "string", required: true, example: "DOG-001" },
      { key: "name", label: "商品名", type: "string", required: true, example: "ささみジャーキー 100g" },
      { key: "categoryName", label: "カテゴリ名", type: "string", required: true, example: "犬用おやつ" },
      { key: "unitSymbol", label: "単位", type: "string", required: true, example: "個" },
      { key: "unitPrice", label: "仕入単価", type: "number", required: true, example: "350" },
      { key: "sellingPrice", label: "売価", type: "number", required: false, example: "580" },
      { key: "supplierName", label: "仕入先名", type: "string", required: false, example: "株式会社ペットフーズ" },
      { key: "reorderPoint", label: "発注点", type: "number", required: false, example: "20" },
      { key: "reorderQuantity", label: "発注数量", type: "number", required: false, example: "50" },
      { key: "minOrderQuantity", label: "最小発注数", type: "number", required: false, example: "10" },
      { key: "hasExpiry", label: "期限管理", type: "boolean", required: false, example: "TRUE" },
      { key: "defaultExpiryDays", label: "デフォルト期限(日)", type: "number", required: false, example: "180" },
      { key: "storageCondition", label: "保管条件", type: "string", required: false, example: "常温・直射日光を避ける" },
      { key: "janCode", label: "JANコード", type: "string", required: false, example: "4901234567001" },
      { key: "weight", label: "重量(g)", type: "number", required: false, example: "100" },
      { key: "dimensions", label: "サイズ", type: "string", required: false, example: "15x10x3cm" },
      { key: "memo", label: "備考", type: "string", required: false, example: "" },
    ],
  },
];

// ============================================================
// CSV解析
// ============================================================

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(current.trim());
        current = "";
        if (row.some((c) => c !== "")) lines.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }
  // 最終行
  row.push(current.trim());
  if (row.some((c) => c !== "")) lines.push(row);

  return lines;
}

function convertValue(value: string, type: "string" | "number" | "boolean"): string | number | boolean | null {
  if (value === "") return type === "string" ? "" : null;
  if (type === "number") {
    const n = Number(value);
    return isNaN(n) ? null : n;
  }
  if (type === "boolean") {
    const v = value.toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "○";
  }
  return value;
}

// ============================================================
// コンポーネント
// ============================================================

export default function ImportPage() {
  const [selected, setSelected] = useState<CollectionDef | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [phase, setPhase] = useState<"select" | "preview" | "importing" | "done">("select");
  const [importResult, setImportResult] = useState<{ count: number; error?: string }>({ count: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  // テンプレートCSVダウンロード
  const downloadTemplate = (def: CollectionDef) => {
    const headerRow = def.columns.map((c) => c.label).join(",");
    const exampleRow = def.columns.map((c) => c.example).join(",");
    const csv = "\uFEFF" + headerRow + "\n" + exampleRow + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${def.key}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSVファイル読み込み
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setErrors(["データが見つかりません。ヘッダー行とデータ行が必要です。"]);
        return;
      }

      const csvHeaders = rows[0];
      setHeaders(csvHeaders);

      // ヘッダーとカラム定義のマッピング
      const columnMap: { csvIndex: number; colDef: ColumnDef }[] = [];
      const unmatchedHeaders: string[] = [];
      const missingRequired: string[] = [];

      csvHeaders.forEach((h, i) => {
        const col = selected.columns.find((c) => c.label === h || c.key === h);
        if (col) {
          columnMap.push({ csvIndex: i, colDef: col });
        } else {
          unmatchedHeaders.push(h);
        }
      });

      // 必須チェック
      selected.columns.forEach((col) => {
        if (col.required && !columnMap.find((m) => m.colDef.key === col.key)) {
          missingRequired.push(col.label);
        }
      });

      const errs: string[] = [];
      if (missingRequired.length > 0) {
        errs.push(`必須列が不足: ${missingRequired.join(", ")}`);
      }
      if (unmatchedHeaders.length > 0) {
        errs.push(`不明な列（無視されます）: ${unmatchedHeaders.join(", ")}`);
      }

      // データ行を変換
      const dataRows = rows.slice(1);
      const records: Record<string, unknown>[] = [];

      dataRows.forEach((row, rowIndex) => {
        const record: Record<string, unknown> = {};
        let hasValue = false;

        columnMap.forEach(({ csvIndex, colDef }) => {
          const rawValue = csvIndex < row.length ? row[csvIndex] : "";
          const value = convertValue(rawValue, colDef.type);
          record[colDef.key] = value;
          if (rawValue !== "") hasValue = true;
        });

        // isActive デフォルト true
        if (record["isActive"] === undefined) {
          record["isActive"] = true;
        }

        if (hasValue) {
          // 必須値チェック
          const rowErrors: string[] = [];
          columnMap.forEach(({ colDef }) => {
            if (colDef.required && (record[colDef.key] === null || record[colDef.key] === "")) {
              rowErrors.push(colDef.label);
            }
          });
          if (rowErrors.length > 0) {
            errs.push(`${rowIndex + 2}行目: ${rowErrors.join(", ")} が空です`);
          }
          records.push(record);
        }
      });

      setErrors(errs.filter((e) => !e.startsWith("不明な列")));
      setParsedData(records);
      setPhase("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  // Firestoreに投入
  const handleImport = async () => {
    if (!selected) return;
    setPhase("importing");

    try {
      await batchAddDocuments(selected.collectionName, parsedData);
      setImportResult({ count: parsedData.length });
      setPhase("done");
    } catch (err) {
      setImportResult({
        count: 0,
        error: err instanceof Error ? err.message : "投入に失敗しました",
      });
      setPhase("done");
    }
  };

  // リセット
  const handleReset = () => {
    setSelected(null);
    setParsedData([]);
    setHeaders([]);
    setErrors([]);
    setPhase("select");
    setImportResult({ count: 0 });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* ===== ステップ1: コレクション選択 ===== */}
        {phase === "select" && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">&#128196;</div>
              <h1 className="text-2xl font-bold mb-2">CSVデータ取込</h1>
              <p className="text-slate-400 text-sm">
                CSVファイルからマスタデータをFirestoreに登録します
              </p>
            </div>

            <div className="grid gap-3">
              {COLLECTIONS_DEF.map((def) => (
                <div
                  key={def.key}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{def.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {def.columns.filter((c) => c.required).map((c) => c.label).join(", ")}
                        <span className="text-slate-600"> (必須)</span>
                        {" + "}
                        {def.columns.filter((c) => !c.required).length}項目
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadTemplate(def)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                      >
                        テンプレート
                      </button>
                      <button
                        onClick={() => {
                          setSelected(def);
                          setTimeout(() => fileRef.current?.click(), 100);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        CSVを選択
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {/* ===== ステップ2: プレビュー ===== */}
        {phase === "preview" && selected && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold">{selected.label} - プレビュー</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {parsedData.length}件のデータを確認してください
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                戻る
              </button>
            </div>

            {/* エラー表示 */}
            {errors.length > 0 && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm font-medium mb-2">エラー</p>
                {errors.map((err, i) => (
                  <p key={i} className="text-red-400/80 text-xs">{err}</p>
                ))}
              </div>
            )}

            {/* テーブル */}
            {parsedData.length > 0 && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">#</th>
                          {selected.columns.map((col) => {
                            const hasData = parsedData.some((r) => r[col.key] !== undefined && r[col.key] !== null && r[col.key] !== "");
                            if (!hasData && !col.required) return null;
                            return (
                              <th key={col.key} className="px-3 py-2 text-left text-xs text-slate-500 font-medium whitespace-nowrap">
                                {col.label}
                                {col.required && <span className="text-red-400 ml-0.5">*</span>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 50).map((row, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-xs text-slate-600">{i + 1}</td>
                            {selected.columns.map((col) => {
                              const hasData = parsedData.some((r) => r[col.key] !== undefined && r[col.key] !== null && r[col.key] !== "");
                              if (!hasData && !col.required) return null;
                              const val = row[col.key];
                              return (
                                <td key={col.key} className="px-3 py-2 text-xs whitespace-nowrap">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-600">-</span>
                                  ) : typeof val === "boolean" ? (
                                    <span className={val ? "text-emerald-400" : "text-slate-500"}>{val ? "○" : "×"}</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 50 && (
                    <div className="px-3 py-2 text-xs text-slate-600 border-t border-slate-800">
                      ... 他 {parsedData.length - 50} 件
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleImport}
                    disabled={errors.some((e) => !e.startsWith("不明な列"))}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors text-lg"
                  >
                    {parsedData.length}件を登録する
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== ステップ3: 投入中 ===== */}
        {phase === "importing" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-pulse">&#128451;</div>
            <h1 className="text-xl font-bold mb-2">登録中...</h1>
            <p className="text-slate-400 text-sm">{parsedData.length}件のデータをFirestoreに書き込んでいます</p>
          </div>
        )}

        {/* ===== ステップ4: 完了 ===== */}
        {phase === "done" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">
              {importResult.error ? "❌" : "✅"}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {importResult.error ? "エラー" : "登録完了"}
            </h1>
            {importResult.error ? (
              <p className="text-red-400 text-sm mb-6">{importResult.error}</p>
            ) : (
              <p className="text-emerald-400 text-sm mb-6">
                {selected?.label}に {importResult.count}件 登録しました
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
              >
                続けて別のデータを取込む
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
