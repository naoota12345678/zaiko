"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument, removeDocument } from "@/lib/firestore";
import { CancelPolicy, CancelPolicyRule } from "@/types";

interface PolicyForm {
  name: string;
  rules: CancelPolicyRule[];
  isActive: boolean;
}

const INITIAL_RULE: CancelPolicyRule = {
  daysBeforeStart: 7,
  feeType: "percentage",
  feeValue: 0,
};

const INITIAL_FORM: PolicyForm = {
  name: "",
  rules: [{ ...INITIAL_RULE }],
  isActive: true,
};

export default function CancelPolicyTab() {
  const { storeId } = useAuth();
  const [policies, setPolicies] = useState<(CancelPolicy & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPolicies = async () => {
    if (!storeId) return;
    try {
      const data = await getByStore<CancelPolicy>("cancelPolicies", storeId);
      setPolicies(data);
    } catch (err) {
      console.error("キャンセルポリシーの取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPolicies(); }, [storeId]);

  const startNew = () => {
    setForm({ ...INITIAL_FORM, rules: [{ ...INITIAL_RULE }] });
    setEditing("new");
    setMessage(null);
  };

  const startEdit = (policy: CancelPolicy & { id: string }) => {
    setForm({
      name: policy.name,
      rules: policy.rules.map((r) => ({ ...r })),
      isActive: policy.isActive,
    });
    setEditing(policy.id);
    setMessage(null);
  };

  const cancel = () => {
    setEditing(null);
    setMessage(null);
  };

  const addRule = () => {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, { ...INITIAL_RULE }] }));
  };

  const removeRule = (index: number) => {
    setForm((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const updateRule = (index: number, field: keyof CancelPolicyRule, value: string | number) => {
    setForm((prev) => {
      const rules = [...prev.rules];
      rules[index] = { ...rules[index], [field]: field === "feeType" ? value : Number(value) };
      return { ...prev, rules };
    });
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!form.name.trim()) { setMessage({ type: "error", text: "ポリシー名を入力してください。" }); return; }
    if (form.rules.length === 0) { setMessage({ type: "error", text: "ルールを1つ以上追加してください。" }); return; }

    setSaving(true);
    setMessage(null);

    try {
      const sortedRules = [...form.rules].sort((a, b) => b.daysBeforeStart - a.daysBeforeStart);
      const saveData = { storeId, name: form.name, rules: sortedRules, isActive: form.isActive };

      if (editing === "new") {
        await addDocument("cancelPolicies", saveData);
      } else {
        await updateDocument("cancelPolicies", editing!, saveData);
      }

      setEditing(null);
      await loadPolicies();
      setMessage({ type: "success", text: "保存しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("保存に失敗:", err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm("このキャンセルポリシーを削除しますか？")) return;
    try {
      await removeDocument("cancelPolicies", policyId);
      await loadPolicies();
    } catch (err) {
      console.error("削除に失敗:", err);
    }
  };

  const formatRule = (rule: CancelPolicyRule) => {
    const days = rule.daysBeforeStart === 0 ? "当日" : `${rule.daysBeforeStart}日前`;
    const fee = rule.feeType === "percentage" ? `${rule.feeValue}%` : `${rule.feeValue.toLocaleString()}円`;
    return `${days}: ${fee}`;
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
              {editing === "new" ? "キャンセルポリシー追加" : "キャンセルポリシー編集"}
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">ポリシー名</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="通常キャンセル" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-slate-300">有効</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">キャンセル料ルール</label>
                <button onClick={addRule} className="text-blue-400 hover:text-blue-300 text-sm">+ ルール追加</button>
              </div>
              <div className="space-y-2">
                {form.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-slate-400 whitespace-nowrap">貸出日の</span>
                      <input type="number" value={rule.daysBeforeStart} onChange={(e) => updateRule(i, "daysBeforeStart", e.target.value)}
                        className="form-input w-20 text-center" min={0} />
                      <span className="text-sm text-slate-400 whitespace-nowrap">日前 →</span>
                      <select value={rule.feeType} onChange={(e) => updateRule(i, "feeType", e.target.value)} className="form-select w-28">
                        <option value="percentage">%</option>
                        <option value="fixed">固定額</option>
                      </select>
                      <input type="number" value={rule.feeValue} onChange={(e) => updateRule(i, "feeValue", e.target.value)}
                        className="form-input w-24 text-right" min={0} />
                      <span className="text-sm text-slate-400">{rule.feeType === "percentage" ? "%" : "円"}</span>
                    </div>
                    {form.rules.length > 1 && (
                      <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">例: 7日前 → 0%、3日前 → 30%、前日 → 50%、当日 → 100%</p>
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
        <h2 className="text-sm text-slate-400">貸出日までの日数に応じたキャンセル料を設定します。</h2>
        {!editing && (
          <button onClick={startNew} className="btn btn-primary">+ ポリシー追加</button>
        )}
      </div>

      {policies.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">キャンセルポリシーが登録されていません</h2>
          <p className="text-slate-500 text-sm mb-4">「ポリシー追加」からキャンセル料のルールを設定してください。</p>
          {!editing && <button onClick={startNew} className="btn btn-primary">+ ポリシー追加</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div key={policy.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium">{policy.name}</h3>
                      <span className={`badge ${policy.isActive ? "badge-green" : "badge-gray"}`}>
                        {policy.isActive ? "有効" : "無効"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {policy.rules
                        .sort((a, b) => b.daysBeforeStart - a.daysBeforeStart)
                        .map((rule, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                            {formatRule(rule)}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(policy)} className="text-blue-400 hover:text-blue-300 text-sm">編集</button>
                    <button onClick={() => handleDelete(policy.id)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
