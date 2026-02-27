"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import {
  Reservation,
  ReservationStatus,
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  VEHICLE_CLASS_LABELS,
} from "@/types";
import { Timestamp } from "firebase/firestore";

const STATUS_BADGE: Record<ReservationStatus, string> = {
  pending_approval: "badge-amber",
  approved: "badge-blue",
  converted_to_rental: "badge-green",
  cancelled: "badge-gray",
  rejected: "badge-red",
};

function formatDate(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val);
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) +
    " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function ReservationsPage() {
  const { storeId } = useAuth();
  const [reservations, setReservations] = useState<(Reservation & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "all" | "cancelled">("active");

  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      try {
        const data = await getByStore<Reservation>("reservations", storeId);
        data.sort((a, b) => {
          const aTime = a.startDate instanceof Timestamp ? a.startDate.toMillis() : 0;
          const bTime = b.startDate instanceof Timestamp ? b.startDate.toMillis() : 0;
          return bTime - aTime;
        });
        setReservations(data);
      } catch (err) {
        console.error("予約データの取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  const filtered = reservations.filter((r) => {
    if (filter === "active") return ["pending_approval", "approved"].includes(r.status);
    if (filter === "cancelled") return ["cancelled", "rejected"].includes(r.status);
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
          <h1 className="text-2xl font-bold text-white">予約管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            予約件数 {reservations.length} 件
          </p>
        </div>
        <Link href="/reservations/new" className="btn btn-primary">
          + 新規予約
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "active", label: "有効な予約" },
          { key: "all", label: "すべて" },
          { key: "cancelled", label: "キャンセル済み" },
        ] as const).map((f) => (
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
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            {filter === "active" ? "有効な予約がありません" : "予約がありません"}
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            「新規予約」から予約を登録してください。
          </p>
          <Link href="/reservations/new" className="btn btn-primary">+ 新規予約</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>予約番号</th>
                <th>顧客名</th>
                <th>車両</th>
                <th>貸出日時</th>
                <th>返却予定</th>
                <th>経路</th>
                <th>合計</th>
                <th>ステータス</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-white text-xs">{r.reservationNumber}</td>
                  <td className="font-semibold text-white">{r.customerName}</td>
                  <td>
                    <span className="text-white">{r.vehiclePlate}</span>
                    <span className="text-slate-500 text-xs ml-1">
                      {VEHICLE_CLASS_LABELS[r.vehicleClass] ?? ""}
                    </span>
                  </td>
                  <td className="text-slate-400 text-sm">{formatDate(r.startDate)}</td>
                  <td className="text-slate-400 text-sm">{formatDate(r.endDate)}</td>
                  <td className="text-slate-400 text-sm">
                    {RESERVATION_SOURCE_LABELS[r.source] ?? r.source}
                  </td>
                  <td className="text-white">
                    {r.totalPrice?.toLocaleString() ?? "-"}円
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-gray"}`}>
                      {RESERVATION_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/reservations/${r.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
