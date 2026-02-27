"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, updateDocument, removeDocument } from "@/lib/firestore";
import { MaintenanceShop } from "@/types";

export default function MaintenanceShopTab() {
  const { storeId } = useAuth();
  const [shops, setShops] = useState<(MaintenanceShop & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // フォーム
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!storeId) return;
    loadShops();
  }, [storeId]);

  const loadShops = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getByStore<MaintenanceShop>("maintenanceShops", storeId);
      setShops(data.filter((s) => s.isActive));
    } catch (err) {
      console.error("整備工場の取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setPhone(""); setAddress("");
    setEditId(null); setShowForm(false);
  };

  const startEdit = (shop: MaintenanceShop & { id: string }) => {
    setName(shop.name); setPhone(shop.phone); setAddress(shop.address);
    setEditId(shop.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!storeId || !name.trim()) return;
    setSaving(true); setMessage(null);
    try {
      if (editId) {
        await updateDocument("maintenanceShops", editId, { name, phone, address });
      } else {
        await addDocument("maintenanceShops", { storeId, name, phone, address, isActive: true });
      }
      await loadShops();
      resetForm();
      setMessage({ type: "success", text: editId ? "更新しました。" : "追加しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この整備工場を削除しますか？")) return;
    try {
      await updateDocument("maintenanceShops", id, { isActive: false });
      await loadShops();
      setMessage({ type: "success", text: "削除しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "削除に失敗しました。" });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-4xl">
      {message && <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>{message.text}</div>}

      <div className="flex justify-between items-center mb-4">
        <p className="text-slate-400 text-sm">整備記録で選択できる整備工場を管理します。</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">+ 追加</button>
        )}
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">{editId ? "整備工場を編集" : "整備工場を追加"}</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">名称</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="○○自動車整備工場" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">電話番号</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" placeholder="03-1234-5678" />
              </div>
              <div>
                <label className="form-label">住所</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" placeholder="東京都..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={resetForm} className="btn btn-secondary">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !name.trim()} className="btn btn-primary">{saving ? "保存中..." : "保存"}</button>
            </div>
          </div>
        </div>
      )}

      {shops.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔧</div>
          <p className="text-slate-400">整備工場が登録されていません。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>電話番号</th>
                <th>住所</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td className="text-white font-medium">{s.name}</td>
                  <td className="text-slate-400">{s.phone || "-"}</td>
                  <td className="text-slate-400">{s.address || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(s)} className="text-blue-400 hover:text-blue-300 text-sm">編集</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-sm">削除</button>
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
