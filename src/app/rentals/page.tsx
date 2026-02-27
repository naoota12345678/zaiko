"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import {
  Rental,
  RentalStatus,
  RENTAL_STATUS_LABELS,
  VEHICLE_CLASS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types";
import { Timestamp } from "firebase/firestore";

const STATUS_BADGE: Record<RentalStatus, string> = {
  active: "badge-blue",
  extended: "badge-amber",
  overdue: "badge-red",
  unreturned: "badge-red",
  returned: "badge-green",
  early_returned: "badge-green",
};

function formatDate(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) +
    " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function getDisplayStatus(rental: Rental): { status: RentalStatus; label: string } {
  // active かつ endDate < now → 表示上「返却超過」
  if (rental.status === "active" || rental.status === "extended") {
    const endDate = rental.endDate instanceof Timestamp
      ? rental.endDate.toDate()
      : new Date(rental.endDate as unknown as string);
    if (endDate < new Date()) {
      return { status: "overdue", label: RENTAL_STATUS_LABELS.overdue };
    }
  }
  return { status: rental.status, label: RENTAL_STATUS_LABELS[rental.status] };
}

type FilterKey = "active" | "all" | "returned";

export default function RentalsPage() {
  const { storeId } = useAuth();
  const [rentals, setRentals] = useState<(Rental & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("active");

  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      try {
        const data = await getByStore<Rental>("rentals", storeId);
        data.sort((a, b) => {
          const aTime = a.startDate instanceof Timestamp ? a.startDate.toMillis() : 0;
          const bTime = b.startDate instanceof Timestamp ? b.startDate.toMillis() : 0;
          return bTime - aTime;
        });
        setRentals(data);
      } catch (err) {
        console.error("貸出データの取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  const filtered = rentals.filter((r) => {
    if (filter === "active") {
      return ["active", "extended", "overdue", "unreturned"].includes(r.status);
    }
    if (filter === "returned") {
      return ["returned", "early_returned"].includes(r.status);
    }
    return true;
  });

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">貸出管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            貸出件数 {rentals.length} 件
          </p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "active" as const, label: "貸出中" },
          { key: "all" as const, label: "すべて" },
          { key: "returned" as const, label: "返却済み" },
        ]).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-500"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            {filter === "active" ? "貸出中のデータがありません" : "貸出データがありません"}
          </h2>
          <p className="text-slate-500 text-sm">
            予約管理画面から「貸出開始」で貸出を作成できます。
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>契約番号</th>
                <th>顧客名</th>
                <th>車両</th>
                <th>貸出日時</th>
                <th>返却予定</th>
                <th>ステータス</th>
                <th className="text-right">残金</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const display = getDisplayStatus(r);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-white text-xs">{r.contractNumber}</td>
                    <td className="font-semibold text-white">{r.customerName}</td>
                    <td>
                      <span className="text-white">{r.vehiclePlate}</span>
                      <span className="text-slate-500 text-xs ml-1">
                        {VEHICLE_CLASS_LABELS[r.vehicleClass] ?? ""}
                      </span>
                    </td>
                    <td className="text-slate-400 text-sm">{formatDate(r.startDate)}</td>
                    <td className="text-slate-400 text-sm">{formatDate(r.endDate)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[display.status] ?? "badge-gray"}`}>
                        {display.label}
                      </span>
                    </td>
                    <td className="text-right text-white">
                      {(r.balance ?? 0).toLocaleString()}円
                    </td>
                    <td>
                      <Link href={`/rentals/${r.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm">
                        詳細
                      </Link>
                    </td>
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
