"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument, removeDocument } from "@/lib/firestore";
import {
  PricingPlan,
  VehicleClass,
  DurationType,
  VEHICLE_CLASS_LABELS,
  DURATION_TYPE_LABELS,
} from "@/types";

interface PlanForm {
  name: string;
  vehicleClass: VehicleClass;
  durationType: DurationType;
  durationDays: number;
  basePrice: number;
  highSeasonPrice: number;
  perExtraDayPrice: number;
  isActive: boolean;
  sortOrder: number;
}

const DURATION_DEFAULTS: Record<DurationType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  custom: 1,
};

const INITIAL_PLAN: PlanForm = {
  name: "",
  vehicleClass: "kei",
  durationType: "daily",
  durationDays: 1,
  basePrice: 0,
  highSeasonPrice: 0,
  perExtraDayPrice: 0,
  isActive: true,
  sortOrder: 0,
};

export default function PricingPlansTab() {
  const { storeId } = useAuth();
  const [plans, setPlans] = useState<(PricingPlan & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // plan id or "new"
  const [form, setForm] = useState<PlanForm>(INITIAL_PLAN);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterClass, setFilterClass] = useState<VehicleClass | "all">("all");

  const loadPlans = async () => {
    if (!storeId) return;
    try {
      const data = await getByStore<PricingPlan>("pricingPlans", storeId);
      data.sort((a, b) => {
        const classOrder = Object.keys(VEHICLE_CLASS_LABELS);
        const ai = classOrder.indexOf(a.vehicleClass);
        const bi = classOrder.indexOf(b.vehicleClass);
        if (ai !== bi) return ai - bi;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      setPlans(data);
    } catch (err) {
      console.error("料金プランの取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, [storeId]);

  const startNew = () => {
    setForm(INITIAL_PLAN);
    setEditing("new");
    setMessage(null);
  };

  const startEdit = (plan: PricingPlan & { id: string }) => {
    setForm({
      name: plan.name,
      vehicleClass: plan.vehicleClass,
      durationType: plan.durationType,
      durationDays: plan.durationDays,
      basePrice: plan.basePrice,
      highSeasonPrice: plan.highSeasonPrice,
      perExtraDayPrice: plan.perExtraDayPrice,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setEditing(plan.id);
    setMessage(null);
  };

  const cancel = () => {
    setEditing(null);
    setMessage(null);
  };

  const handleDurationTypeChange = (dt: DurationType) => {
    setForm((prev) => ({
      ...prev,
      durationType: dt,
      durationDays: DURATION_DEFAULTS[dt],
      name: DURATION_TYPE_LABELS[dt],
    }));
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!form.name.trim()) { setMessage({ type: "error", text: "プラン名を入力してください。" }); return; }
    if (form.basePrice <= 0) { setMessage({ type: "error", text: "基本料金を入力してください。" }); return; }

    setSaving(true);
    setMessage(null);

    try {
      const saveData = { storeId, ...form };

      if (editing === "new") {
        await addDocument("pricingPlans", saveData);
      } else {
        await updateDocument("pricingPlans", editing!, saveData);
      }

      setEditing(null);
      await loadPlans();
      setMessage({ type: "success", text: "保存しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("保存に失敗:", err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("この料金プランを削除しますか？")) return;
    try {
      await removeDocument("pricingPlans", planId);
      await loadPlans();
    } catch (err) {
      console.error("削除に失敗:", err);
    }
  };

  const filteredPlans = plans.filter((p) => filterClass === "all" || p.vehicleClass === filterClass);

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-5xl">
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>
          {message.text}
        </div>
      )}

      {/* 編集フォーム */}
      {editing && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">
              {editing === "new" ? "料金プラン追加" : "料金プラン編集"}
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">車種クラス</label>
                <select value={form.vehicleClass} onChange={(e) => setForm((p) => ({ ...p, vehicleClass: e.target.value as VehicleClass }))} className="form-select">
                  {Object.entries(VEHICLE_CLASS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">期間タイプ</label>
                <select value={form.durationType} onChange={(e) => handleDurationTypeChange(e.target.value as DurationType)} className="form-select">
                  {Object.entries(DURATION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">プラン名</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="日貸し" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="form-label">期間日数</label>
                <input type="number" value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value) }))} className="form-input" min={1} />
              </div>
              <div>
                <label className="form-label">基本料金 (税抜)</label>
                <input type="number" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: Number(e.target.value) }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">ハイシーズン料金</label>
                <input type="number" value={form.highSeasonPrice} onChange={(e) => setForm((p) => ({ ...p, highSeasonPrice: Number(e.target.value) }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">超過1日あたり</label>
                <input type="number" value={form.perExtraDayPrice} onChange={(e) => setForm((p) => ({ ...p, perExtraDayPrice: Number(e.target.value) }))} className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">表示順</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className="form-input" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-slate-300">有効</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={cancel} className="btn btn-secondary">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一覧 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setFilterClass("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterClass === "all" ? "bg-blue-600/20 text-blue-400 border border-blue-500" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>
            すべて
          </button>
          {Object.entries(VEHICLE_CLASS_LABELS).map(([k, v]) => {
            const hasPlans = plans.some((p) => p.vehicleClass === k);
            if (!hasPlans && filterClass !== k) return null;
            return (
              <button key={k} onClick={() => setFilterClass(k as VehicleClass)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterClass === k ? "bg-blue-600/20 text-blue-400 border border-blue-500" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>
                {v}
              </button>
            );
          })}
        </div>
        {!editing && (
          <button onClick={startNew} className="btn btn-primary">+ プラン追加</button>
        )}
      </div>

      {filteredPlans.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">料金プランが登録されていません</h2>
          <p className="text-slate-500 text-sm mb-4">「プラン追加」から車種クラス別の料金を設定してください。</p>
          {!editing && <button onClick={startNew} className="btn btn-primary">+ プラン追加</button>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>車種クラス</th>
                <th>プラン名</th>
                <th>期間</th>
                <th className="text-right">基本料金</th>
                <th className="text-right">ハイシーズン</th>
                <th className="text-right">超過/日</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td><span className="badge badge-blue">{VEHICLE_CLASS_LABELS[plan.vehicleClass]}</span></td>
                  <td className="text-white font-medium">{plan.name}</td>
                  <td className="text-slate-400">{plan.durationDays}日</td>
                  <td className="text-right text-white">{plan.basePrice.toLocaleString()}円</td>
                  <td className="text-right text-amber-400">{plan.highSeasonPrice.toLocaleString()}円</td>
                  <td className="text-right text-slate-400">{plan.perExtraDayPrice.toLocaleString()}円</td>
                  <td>
                    <span className={`badge ${plan.isActive ? "badge-green" : "badge-gray"}`}>
                      {plan.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(plan)} className="text-blue-400 hover:text-blue-300 text-sm">編集</button>
                      <button onClick={() => handleDelete(plan.id)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 料金計算ルール */}
      <div className="mt-6 card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">料金計算ルール</h2>
        </div>
        <div className="card-body text-sm text-slate-400 space-y-3">
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">1.</span>
            <p>予約時に車種クラス・貸出日数から、登録済みプランの中で<span className="text-white font-medium">最安値</span>となる組み合わせを自動計算します。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">2.</span>
            <p>プラン期間より長い場合は<span className="text-white font-medium">「基本料金 ＋ 超過日数 × 超過1日あたり料金」</span>で計算されます。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">3.</span>
            <p>複数プランの組み合わせ（例: 週貸し×2 ＋ 超過3日）でより安くなる場合は、そちらが適用されます。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">4.</span>
            <p>店舗情報で設定した<span className="text-white font-medium">ハイシーズン期間</span>中の貸出には、ハイシーズン料金が適用されます。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-mono shrink-0">5.</span>
            <p>自動計算後も、予約画面で手動調整が可能です。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
