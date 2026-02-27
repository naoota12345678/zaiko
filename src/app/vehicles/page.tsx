"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import {
  Vehicle,
  VEHICLE_CLASS_LABELS,
  FUEL_TYPE_LABELS,
  VehicleStatus,
} from "@/types";

const STATUS_CONFIG: Record<VehicleStatus, { label: string; class: string }> = {
  active: { label: "稼働中", class: "badge-green" },
  suspended: { label: "停止中", class: "badge-amber" },
  deleted: { label: "削除済み", class: "badge-gray" },
};

export default function VehiclesPage() {
  const { storeId } = useAuth();
  const [vehicles, setVehicles] = useState<(Vehicle & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");

  useEffect(() => {
    if (!storeId) return;

    const load = async () => {
      try {
        const data = await getByStore<Vehicle>("vehicles", storeId);
        setVehicles(data);
      } catch (err) {
        console.error("車両データの取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storeId]);

  const filtered = vehicles.filter((v) => {
    if (filter === "all") return v.status !== "deleted";
    return v.status === filter;
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">車両管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            登録車両 {vehicles.filter((v) => v.status !== "deleted").length} 台
          </p>
        </div>
        <Link href="/vehicles/new" className="btn btn-primary">
          + 新規登録
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "all", label: "すべて" },
          { key: "active", label: "稼働中" },
          { key: "suspended", label: "停止中" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-500"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 一覧テーブル */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🚗</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            車両が登録されていません
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            「新規登録」から車両を追加してください。
          </p>
          <Link href="/vehicles/new" className="btn btn-primary">
            + 新規登録
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>ナンバー</th>
                <th>車種クラス</th>
                <th>メーカー / 車名</th>
                <th>年式</th>
                <th>燃料</th>
                <th>走行距離</th>
                <th>ステータス</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono font-semibold text-white">
                    {v.plateNumber}
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {VEHICLE_CLASS_LABELS[v.vehicleClass] ?? v.vehicleClass}
                    </span>
                  </td>
                  <td>
                    <span className="text-white">{v.maker}</span>
                    <span className="text-slate-400 ml-1">{v.model}</span>
                  </td>
                  <td className="text-slate-400">{v.year}年</td>
                  <td className="text-slate-400">
                    {FUEL_TYPE_LABELS[v.fuelType] ?? v.fuelType}
                  </td>
                  <td className="text-slate-400">
                    {v.currentMileage?.toLocaleString() ?? "-"} km
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CONFIG[v.status]?.class ?? "badge-gray"}`}>
                      {STATUS_CONFIG[v.status]?.label ?? v.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/vehicles/${v.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
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
