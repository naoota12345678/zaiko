"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NetReservationSettings, VehicleClass, VEHICLE_CLASS_LABELS } from "@/types";

const ALL_CLASSES: VehicleClass[] = ["kei", "compact", "sedan", "suv", "minivan", "wagon", "van", "truck"];

const INITIAL: Omit<NetReservationSettings, "updatedAt"> = {
  storeId: "",
  isAccepting: false,
  minRentalDays: 1,
  maxAdvanceDays: 60,
  acceptableClasses: [],
  naviCount: 0,
  reservationIntervalHours: 2,
  advanceHoursLimit: 3,
  timeSlotLimits: [],
  winterSeasonStart: null,
  winterSeasonEnd: null,
  forceStudlessStart: null,
  forceStudlessEnd: null,
};

export default function NetReservationTab() {
  const { storeId } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "netReservationSettings", storeId));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            storeId,
            isAccepting: d.isAccepting ?? false,
            minRentalDays: d.minRentalDays ?? 1,
            maxAdvanceDays: d.maxAdvanceDays ?? 60,
            acceptableClasses: d.acceptableClasses ?? [],
            naviCount: d.naviCount ?? 0,
            reservationIntervalHours: d.reservationIntervalHours ?? 2,
            advanceHoursLimit: d.advanceHoursLimit ?? 3,
            timeSlotLimits: d.timeSlotLimits ?? [],
            winterSeasonStart: d.winterSeasonStart ?? null,
            winterSeasonEnd: d.winterSeasonEnd ?? null,
            forceStudlessStart: d.forceStudlessStart ?? null,
            forceStudlessEnd: d.forceStudlessEnd ?? null,
          });
        } else {
          setIsNew(true);
          setForm({ ...INITIAL, storeId });
        }
      } catch {
        setMessage({ type: "error", text: "読み込みに失敗しました。" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeId]);

  const toggleClass = (cls: VehicleClass) => {
    setForm((prev) => {
      const classes = prev.acceptableClasses.includes(cls)
        ? prev.acceptableClasses.filter((c) => c !== cls)
        : [...prev.acceptableClasses, cls];
      return { ...prev, acceptableClasses: classes };
    });
  };

  const formatDateForInput = (ts: Timestamp | null | undefined): string => {
    if (!ts) return "";
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts as unknown as string);
    return d.toISOString().slice(0, 10);
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true); setMessage(null);
    try {
      await setDoc(doc(db, "netReservationSettings", storeId), {
        ...form,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setIsNew(false);
      setMessage({ type: "success", text: "保存しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-end mb-4">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? "保存中..." : "保存する"}</button>
      </div>
      {message && <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>{message.text}</div>}

      <div className="space-y-6">
        {/* 受付ON/OFF */}
        <section className="card">
          <div className="card-header"><h2 className="text-lg font-semibold text-white">ネット予約受付</h2></div>
          <div className="card-body">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAccepting}
                onChange={(e) => setForm((prev) => ({ ...prev, isAccepting: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${form.isAccepting ? "text-green-400" : "text-slate-400"}`}>
                {form.isAccepting ? "受付中" : "受付停止中"}
              </span>
            </label>
          </div>
        </section>

        {/* 基本設定 */}
        <section className="card">
          <div className="card-header"><h2 className="text-lg font-semibold text-white">基本設定</h2></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">最低貸出日数</label>
                <input type="number" value={form.minRentalDays} onChange={(e) => setForm((prev) => ({ ...prev, minRentalDays: Number(e.target.value) }))} className="form-input" min={1} />
              </div>
              <div>
                <label className="form-label">最大予約可能日数 (先)</label>
                <select value={form.maxAdvanceDays} onChange={(e) => setForm((prev) => ({ ...prev, maxAdvanceDays: Number(e.target.value) }))} className="form-select">
                  <option value={30}>30日</option>
                  <option value={60}>60日</option>
                  <option value={90}>90日</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">予約間隔 (清掃時間, 時間)</label>
                <input type="number" value={form.reservationIntervalHours} onChange={(e) => setForm((prev) => ({ ...prev, reservationIntervalHours: Number(e.target.value) }))} className="form-input" min={0} max={10} />
              </div>
              <div>
                <label className="form-label">受付締切 (何時間前まで)</label>
                <input type="number" value={form.advanceHoursLimit} onChange={(e) => setForm((prev) => ({ ...prev, advanceHoursLimit: Number(e.target.value) }))} className="form-input" min={0} max={10} />
              </div>
            </div>
          </div>
        </section>

        {/* 受付車種 */}
        <section className="card">
          <div className="card-header"><h2 className="text-lg font-semibold text-white">受付車種クラス</h2></div>
          <div className="card-body">
            <div className="flex flex-wrap gap-3">
              {ALL_CLASSES.map((cls) => (
                <label key={cls} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  form.acceptableClasses.includes(cls)
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}>
                  <input type="checkbox" checked={form.acceptableClasses.includes(cls)} onChange={() => toggleClass(cls)} className="sr-only" />
                  <span className="text-sm font-medium">{VEHICLE_CLASS_LABELS[cls]}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 冬期シーズン設定 */}
        <section className="card">
          <div className="card-header"><h2 className="text-lg font-semibold text-white">冬期シーズン設定</h2></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">冬期料金開始日</label>
                <input type="date" value={formatDateForInput(form.winterSeasonStart)} onChange={(e) => setForm((prev) => ({ ...prev, winterSeasonStart: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">冬期料金終了日</label>
                <input type="date" value={formatDateForInput(form.winterSeasonEnd)} onChange={(e) => setForm((prev) => ({ ...prev, winterSeasonEnd: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">スタッドレス強制期間開始</label>
                <input type="date" value={formatDateForInput(form.forceStudlessStart)} onChange={(e) => setForm((prev) => ({ ...prev, forceStudlessStart: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">スタッドレス強制期間終了</label>
                <input type="date" value={formatDateForInput(form.forceStudlessEnd)} onChange={(e) => setForm((prev) => ({ ...prev, forceStudlessEnd: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null }))} className="form-input" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-2 pb-8">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? "保存中..." : "保存する"}</button>
        </div>
      </div>
    </div>
  );
}
