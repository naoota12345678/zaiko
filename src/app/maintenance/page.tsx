"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument } from "@/lib/firestore";
import {
  MaintenanceRecord,
  MaintenanceShop,
  Vehicle,
  MaintenanceCategory,
  MAINTENANCE_CATEGORY_LABELS,
} from "@/types";
import { Timestamp } from "firebase/firestore";

function formatDate(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

export default function MaintenancePage() {
  const { storeId, userData } = useAuth();
  const [records, setRecords] = useState<(MaintenanceRecord & { id: string })[]>([]);
  const [vehicles, setVehicles] = useState<(Vehicle & { id: string })[]>([]);
  const [shops, setShops] = useState<(MaintenanceShop & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // フォーム
  const [vehicleId, setVehicleId] = useState("");
  const [shopId, setShopId] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("oil_change");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(0);
  const [mileage, setMileage] = useState(0);
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      try {
        const [recs, vehs, shps] = await Promise.all([
          getByStore<MaintenanceRecord>("maintenanceRecords", storeId),
          getByStore<Vehicle>("vehicles", storeId),
          getByStore<MaintenanceShop>("maintenanceShops", storeId),
        ]);
        recs.sort((a, b) => {
          const aT = a.serviceDate instanceof Timestamp ? a.serviceDate.toMillis() : 0;
          const bT = b.serviceDate instanceof Timestamp ? b.serviceDate.toMillis() : 0;
          return bT - aT;
        });
        setRecords(recs);
        setVehicles(vehs.filter((v) => v.status === "active"));
        setShops(shps.filter((s) => s.isActive));
      } catch (err) {
        console.error("整備記録の取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  const filtered = records.filter((r) => {
    if (filterVehicle && r.vehicleId !== filterVehicle) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    return true;
  });

  const resetForm = () => {
    setVehicleId(""); setShopId(""); setCategory("oil_change");
    setDescription(""); setCost(0); setMileage(0); setMemo("");
    setServiceDate(new Date().toISOString().slice(0, 10));
    setNextServiceDate(""); setShowForm(false);
  };

  const handleSave = async () => {
    if (!storeId || !vehicleId) return;
    setSaving(true); setMessage(null);
    try {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      const shop = shops.find((s) => s.id === shopId);

      await addDocument("maintenanceRecords", {
        storeId,
        vehicleId,
        vehiclePlate: vehicle?.plateNumber ?? "",
        shopId: shopId || "",
        shopName: shop?.name ?? "",
        category,
        description,
        cost,
        mileageAtService: mileage,
        serviceDate: Timestamp.fromDate(new Date(serviceDate)),
        nextServiceDate: nextServiceDate ? Timestamp.fromDate(new Date(nextServiceDate)) : null,
        memo,
      });

      // 再読み込み
      const recs = await getByStore<MaintenanceRecord>("maintenanceRecords", storeId);
      recs.sort((a, b) => {
        const aT = a.serviceDate instanceof Timestamp ? a.serviceDate.toMillis() : 0;
        const bT = b.serviceDate instanceof Timestamp ? b.serviceDate.toMillis() : 0;
        return bT - aT;
      });
      setRecords(recs);
      resetForm();
      setMessage({ type: "success", text: "整備記録を登録しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "登録に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white">整備管理</h1>
          <p className="text-slate-400 text-sm mt-1">整備記録 {records.length} 件</p>
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
          <div className="card-header"><h3 className="text-lg font-semibold text-white">整備記録を登録</h3></div>
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
                <label className="form-label">整備工場</label>
                <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="form-select">
                  <option value="">選択してください</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">カテゴリ</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as MaintenanceCategory)} className="form-select">
                  {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">実施日</label>
                <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">次回予定日 (任意)</label>
                <input type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">費用 (円)</label>
                <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="form-input" min={0} />
              </div>
              <div>
                <label className="form-label">実施時メーター (km)</label>
                <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className="form-input" min={0} />
              </div>
            </div>
            <div>
              <label className="form-label">作業内容</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" placeholder="エンジンオイル交換 5W-30" />
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
      <div className="flex gap-3 mb-4">
        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="form-select max-w-xs">
          <option value="">全車両</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plateNumber}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select max-w-xs">
          <option value="">全カテゴリ</option>
          {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">整備記録がありません</h2>
          <p className="text-slate-500 text-sm">「新規登録」から整備記録を追加してください。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>実施日</th>
                <th>車両</th>
                <th>カテゴリ</th>
                <th>作業内容</th>
                <th>整備工場</th>
                <th className="text-right">費用</th>
                <th className="text-right">メーター</th>
                <th>次回予定</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="text-white text-sm">{formatDate(r.serviceDate)}</td>
                  <td className="text-white font-medium">{r.vehiclePlate}</td>
                  <td>
                    <span className="badge badge-blue">
                      {MAINTENANCE_CATEGORY_LABELS[r.category] ?? r.category}
                    </span>
                  </td>
                  <td className="text-slate-300 text-sm">{r.description || "-"}</td>
                  <td className="text-slate-400 text-sm">{r.shopName || "-"}</td>
                  <td className="text-right text-white text-sm">{r.cost.toLocaleString()}円</td>
                  <td className="text-right text-slate-400 text-sm">{r.mileageAtService.toLocaleString()} km</td>
                  <td className="text-slate-400 text-sm">{formatDate(r.nextServiceDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
