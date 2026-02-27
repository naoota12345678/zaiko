"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import {
  Payment,
  Rental,
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PaymentType,
} from "@/types";
import { Timestamp } from "firebase/firestore";

type PeriodFilter = "this_month" | "last_month" | "all";

function formatDateOnly(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

const PAYMENT_CATEGORY_LABELS: Record<string, string> = {
  deposit: "前受金",
  rental_payment: "レンタル代",
  cancel_fee_payment: "キャンセル料",
  early_return: "早期返却返金",
  overcharge: "過剰請求返金",
  base_rental: "基本料金",
  extension: "延長料金",
  option: "オプション",
  additional: "追加料金",
  cancel_fee: "キャンセル料",
  bad_debt: "貸倒れ",
  cancel_fee_waive: "キャンセル料免除",
};

export default function SalesPage() {
  const { storeId } = useAuth();
  const [payments, setPayments] = useState<(Payment & { id: string })[]>([]);
  const [rentals, setRentals] = useState<(Rental & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this_month");

  useEffect(() => {
    if (!storeId) return;

    const load = async () => {
      try {
        const [payData, rentalData] = await Promise.all([
          getByStore<Payment>("payments", storeId),
          getByStore<Rental>("rentals", storeId),
        ]);
        // transactionDate降順ソート
        payData.sort((a, b) => {
          const aTime = a.transactionDate instanceof Timestamp ? a.transactionDate.toMillis() : 0;
          const bTime = b.transactionDate instanceof Timestamp ? b.transactionDate.toMillis() : 0;
          return bTime - aTime;
        });
        setPayments(payData);
        setRentals(rentalData);
      } catch (err) {
        console.error("売上データの取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storeId]);

  // 期間フィルタ
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const filteredPayments = payments.filter((p) => {
    if (periodFilter === "all") return true;
    const txDate = p.transactionDate instanceof Timestamp
      ? p.transactionDate.toDate()
      : new Date(p.transactionDate as unknown as string);

    if (periodFilter === "this_month") {
      return txDate >= thisMonthStart;
    }
    return txDate >= lastMonthStart && txDate <= lastMonthEnd;
  });

  // サマリー計算（当月）
  const thisMonthPayments = payments.filter((p) => {
    const txDate = p.transactionDate instanceof Timestamp
      ? p.transactionDate.toDate()
      : new Date(p.transactionDate as unknown as string);
    return txDate >= thisMonthStart && !p.isCancelled;
  });

  const monthlyIncome = thisMonthPayments
    .filter((p) => p.type === "payment")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyRefund = thisMonthPayments
    .filter((p) => p.type === "refund")
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlySales = monthlyIncome - monthlyRefund;

  const monthlyCount = thisMonthPayments.filter(
    (p) => p.type === "payment" || p.type === "refund"
  ).length;

  // 未回収残高（全貸出のbalance合計）
  const uncollected = rentals
    .filter((r) => !["returned", "early_returned"].includes(r.status) || (r.balance ?? 0) > 0)
    .reduce((sum, r) => sum + (r.balance ?? 0), 0);

  // 貸出IDから契約番号を引く
  const rentalMap = new Map(rentals.map((r) => [r.id, r]));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-400 text-sm">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">売上管理</h1>
        <p className="text-slate-400 text-sm mt-1">
          入金・返金の一覧と集計
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">当月売上合計</p>
          <p className="text-2xl font-bold text-white">
            {monthlySales.toLocaleString()}
            <span className="text-sm font-normal text-slate-400 ml-1">円</span>
          </p>
          {monthlyRefund > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              入金 {monthlyIncome.toLocaleString()}円 - 返金 {monthlyRefund.toLocaleString()}円
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">当月入金件数</p>
          <p className="text-2xl font-bold text-white">
            {monthlyCount}
            <span className="text-sm font-normal text-slate-400 ml-1">件</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-1">未回収残高</p>
          <p className={`text-2xl font-bold ${uncollected > 0 ? "text-amber-400" : "text-green-400"}`}>
            {uncollected.toLocaleString()}
            <span className="text-sm font-normal text-slate-400 ml-1">円</span>
          </p>
        </div>
      </div>

      {/* フィルタ */}
      <div className="flex gap-2 mb-4">
        {(["this_month", "last_month", "all"] as PeriodFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setPeriodFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              periodFilter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f === "this_month" ? "今月" : f === "last_month" ? "先月" : "すべて"}
          </button>
        ))}
      </div>

      {/* 入金一覧テーブル */}
      {filteredPayments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            入金データがありません
          </h2>
          <p className="text-slate-500 text-sm">
            貸出詳細画面から入金を登録できます。
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>契約番号</th>
                <th>顧客名</th>
                <th>種別</th>
                <th>カテゴリ</th>
                <th className="text-right">金額</th>
                <th>支払方法</th>
                <th>担当</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const linkedRental = p.rentalId ? rentalMap.get(p.rentalId) : null;
                return (
                  <tr key={p.id} className={p.isCancelled ? "opacity-40" : ""}>
                    <td className={`text-sm ${p.isCancelled ? "line-through text-slate-500" : "text-white"}`}>
                      {formatDateOnly(p.transactionDate)}
                    </td>
                    <td className="text-sm">
                      {linkedRental ? (
                        <Link href={`/rentals/${p.rentalId}`} className="text-blue-400 hover:text-blue-300">
                          {linkedRental.contractNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className={`text-sm ${p.isCancelled ? "text-slate-500" : "text-white"}`}>
                      {linkedRental?.customerName ?? "-"}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.type === "payment" ? "badge-green" :
                        p.type === "refund" ? "badge-amber" :
                        p.type === "charge" ? "badge-blue" : "badge-slate"
                      }`}>
                        {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                      </span>
                      {p.isCancelled && (
                        <span className="badge badge-red ml-1">取消</span>
                      )}
                    </td>
                    <td className={`text-sm ${p.isCancelled ? "text-slate-500" : "text-slate-300"}`}>
                      {PAYMENT_CATEGORY_LABELS[p.category] ?? p.category}
                    </td>
                    <td className={`text-right text-sm font-medium ${
                      p.isCancelled ? "line-through text-slate-500" :
                      p.type === "refund" ? "text-red-400" : "text-white"
                    }`}>
                      {p.type === "refund" ? "-" : ""}{p.amount.toLocaleString()}円
                    </td>
                    <td className={`text-sm ${p.isCancelled ? "text-slate-500" : "text-slate-300"}`}>
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                      {p.brandName ? ` (${p.brandName})` : ""}
                    </td>
                    <td className="text-sm text-slate-400">{p.staffName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
