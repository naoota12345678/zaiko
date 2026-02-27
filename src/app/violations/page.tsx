"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument } from "@/lib/firestore";
import { ParkingViolation, Vehicle, Customer } from "@/types";
import { Timestamp } from "firebase/firestore";

type ViolationStatus = "pending" | "resolved" | "paid_by_customer";

const STATUS_LABELS: Record<ViolationStatus, string> = {
  pending: "未解決",
  resolved: "解決済み",
  paid_by_customer: "顧客支払済",
};

const STATUS_BADGE: Record<ViolationStatus, string> = {
  pending: "badge-red",
  resolved: "badge-green",
  paid_by_customer: "badge-blue",
};

function formatDate(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

export default function ViolationsPage() {
  const { storeId } = useAuth();
  const [violations, setViolations] = useState<(ParkingViolation & { id: string })[]>([]);
  const [vehicles, setVehicles] = useState<(Vehicle & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // フォーム
  const [vehicleId, setVehicleId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [violationDate, setViolationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!storeId) return;
    loadData();
  }, [storeId]);

  const loadData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [vios, vehs] = await Promise.all([
        getByStore<ParkingViolation>("parkingViolations", storeId),
        getByStore<Vehicle>("vehicles", storeId),
      ]);
      vios.sort((a, b) => {
        const aT = a.violationDate instanceof Timestamp ? a.violationDate.toMillis() : 0;
        const bT = b.violationDate instanceof Timestamp ? b.violationDate.toMillis() : 0;
        return bT - aT;
      });
      setViolations(vios);
      setVehicles(vehs.filter((v) => v.status === "active"));
    } catch (err) {
      console.error("違法駐車データの取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = violations.filter((v) => {
    if (filterStatus && v.status !== filterStatus) return false;
    return true;
  });

  const resetForm = () => {
    setVehicleId(""); setCustomerName(""); setLocation("");
    setFineAmount(""); setMemo(""); setShowForm(false);
    setViolationDate(new Date().toISOString().slice(0, 10));
  };

  const handleSave = async () => {
    if (!storeId || !vehicleId) return;
    setSaving(true); setMessage(null);
    try {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      await addDocument("parkingViolations", {
        storeId,
        vehicleId,
        vehiclePlate: vehicle?.plateNumber ?? "",
        rentalId: null,
        customerId: null,
        customerName,
        violationDate: Timestamp.fromDate(new Date(violationDate)),
        location,
        fineAmount: Number(fineAmount) || 0,
        status: "pending",
        memo,
      });
      await loadData();
      resetForm();
      setMessage({ type: "success", text: "違法駐車記録を登録しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "登録に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ViolationStatus) => {
    try {
      await updateDocument("parkingViolations", id, { status: newStatus });
      await loadData();
      setMessage({ type: "success", text: "ステータスを更新しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "更新に失敗しました。" });
    }
  };

  const pendingCount = violations.filter((v) => v.status === "pending").length;

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
          <h1 className="text-2xl font-bold text-white">違法駐車管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            合計 {violations.length} 件
            {pendingCount > 0 && <span className="text-red-400 ml-2">({pendingCount}件 未解決)</span>}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">+ 新規登録</button>
        )}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <div className="card-header"><h3 className="text-lg font-semibold text-white">違法駐車を登録</h3></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">車両</label>
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="form-select">
                  <option value="">選択してください</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">利用顧客名</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="form-input" placeholder="該当する場合" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">違反日</label>
                <input type="date" value={violationDate} onChange={(e) => setViolationDate(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">違反場所</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" placeholder="○○市○○町 路上" />
              </div>
              <div>
                <label className="form-label">反則金 (円)</label>
                <input type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className="form-input" min={0} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="form-label">備考</label>
              <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="form-input" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={resetForm} className="btn btn-secondary">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !vehicleId} className="btn btn-primary">{saving ? "登録中..." : "登録"}</button>
            </div>
          </div>
        </div>
      )}

      {/* フィルタ */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus("")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${!filterStatus ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>すべて</button>
        {(Object.entries(STATUS_LABELS) as [ViolationStatus, string][]).map(([k, v]) => (
          <button key={k} onClick={() => setFilterStatus(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === k ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>{v}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🅿️</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">違法駐車記録がありません</h2>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>違反日</th>
                <th>車両</th>
                <th>顧客名</th>
                <th>場所</th>
                <th className="text-right">反則金</th>
                <th>ステータス</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="text-white text-sm">{formatDate(v.violationDate)}</td>
                  <td className="text-white font-medium">{v.vehiclePlate}</td>
                  <td className="text-slate-300 text-sm">{v.customerName || "-"}</td>
                  <td className="text-slate-400 text-sm">{v.location || "-"}</td>
                  <td className="text-right text-white text-sm">{v.fineAmount.toLocaleString()}円</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[v.status as ViolationStatus]}`}>
                      {STATUS_LABELS[v.status as ViolationStatus]}
                    </span>
                  </td>
                  <td>
                    {v.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(v.id, "resolved")} className="text-green-400 hover:text-green-300 text-xs">解決</button>
                        <button onClick={() => handleStatusChange(v.id, "paid_by_customer")} className="text-blue-400 hover:text-blue-300 text-xs">顧客支払</button>
                      </div>
                    )}
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
