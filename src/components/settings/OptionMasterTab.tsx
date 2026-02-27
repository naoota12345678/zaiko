"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument, removeDocument } from "@/lib/firestore";
import { OptionMaster } from "@/types";

type OptionDurationType = "per_day" | "per_rental" | "fixed";

const DURATION_TYPE_LABELS: Record<OptionDurationType, string> = {
  per_day: "日額",
  per_rental: "1回あたり",
  fixed: "固定",
};

interface OptionForm {
  name: string;
  durationType: OptionDurationType;
  unitPrice: number;
  isActive: boolean;
  sortOrder: number;
}

const INITIAL_FORM: OptionForm = {
  name: "",
  durationType: "per_day",
  unitPrice: 0,
  isActive: true,
  sortOrder: 0,
};

export default function OptionMasterTab() {
  const { storeId } = useAuth();
  const [options, setOptions] = useState<(OptionMaster & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<OptionForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOptions = async () => {
    if (!storeId) return;
    try {
      const data = await getByStore<OptionMaster>("optionMasters", storeId);
      data.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setOptions(data);
    } catch (err) {
      console.error("オプションの取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOptions(); }, [storeId]);

  const startNew = () => {
    setForm(INITIAL_FORM);
    setEditing("new");
    setMessage(null);
  };

  const startEdit = (opt: OptionMaster & { id: string }) => {
    setForm({
      name: opt.name,
      durationType: opt.durationType,
      unitPrice: opt.unitPrice,
      isActive: opt.isActive,
      sortOrder: opt.sortOrder,
    });
    setEditing(opt.id);
    setMessage(null);
  };

  const cancel = () => {
    setEditing(null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!form.name.trim()) { setMessage({ type: "error", text: "オプション名を入力してください。" }); return; }
    if (form.unitPrice <= 0) { setMessage({ type: "error", text: "単価を入力してください。" }); return; }

    setSaving(true);
    setMessage(null);

    try {
      const saveData = { storeId, ...form };

      if (editing === "new") {
        await addDocument("optionMasters", saveData);
      } else {
        await updateDocument("optionMasters", editing!, saveData);
      }

      setEditing(null);
      await loadOptions();
      setMessage({ type: "success", text: "保存しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("保存に失敗:", err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (optId: string) => {
    if (!confirm("このオプションを削除しますか？")) return;
    try {
      await removeDocument("optionMasters", optId);
      await loadOptions();
    } catch (err) {
      console.error("削除に失敗:", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-4xl">
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>
          {message.text}
        </div>
      )}

      {editing && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">
              {editing === "new" ? "オプション追加" : "オプション編集"}
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">オプション名</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="カーナビ" />
              </div>
              <div>
                <label className="form-label">料金タイプ</label>
                <select value={form.durationType} onChange={(e) => setForm((p) => ({ ...p, durationType: e.target.value as OptionDurationType }))} className="form-select">
                  {Object.entries(DURATION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">単価 (税抜)</label>
                <input type="number" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} className="form-input" />
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-slate-400">カーナビ・スタッドレスなどの追加オプションを管理します。</h2>
        {!editing && (
          <button onClick={startNew} className="btn btn-primary">+ オプション追加</button>
        )}
      </div>

      {options.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">オプションが登録されていません</h2>
          <p className="text-slate-500 text-sm mb-4">「オプション追加」からカーナビやスタッドレスなどを登録してください。</p>
          {!editing && <button onClick={startNew} className="btn btn-primary">+ オプション追加</button>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>オプション名</th>
                <th>料金タイプ</th>
                <th className="text-right">単価</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt) => (
                <tr key={opt.id}>
                  <td className="text-white font-medium">{opt.name}</td>
                  <td className="text-slate-400">{DURATION_TYPE_LABELS[opt.durationType]}</td>
                  <td className="text-right text-white">{opt.unitPrice.toLocaleString()}円</td>
                  <td>
                    <span className={`badge ${opt.isActive ? "badge-green" : "badge-gray"}`}>
                      {opt.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(opt)} className="text-blue-400 hover:text-blue-300 text-sm">編集</button>
                      <button onClick={() => handleDelete(opt.id)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
                    </div>
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
