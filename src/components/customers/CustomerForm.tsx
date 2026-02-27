"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { addDocument, updateDocument } from "@/lib/firestore";
import { BlackLevel, BLACK_LEVEL_LABELS } from "@/types";

interface CustomerFormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  gender: "male" | "female" | "other";
  birthDate: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  blackLevel: BlackLevel;
  blackReason: string;
  isAppMember: boolean;
  appMemberId: string;
  memo: string;
}

const INITIAL: CustomerFormData = {
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  gender: "male",
  birthDate: "",
  postalCode: "",
  prefecture: "",
  city: "",
  address: "",
  phone: "",
  mobile: "",
  email: "",
  licenseNumber: "",
  licenseExpiry: "",
  licenseType: "普通",
  blackLevel: 0,
  blackReason: "",
  isAppMember: false,
  appMemberId: "",
  memo: "",
};

interface Props {
  customerId?: string;
  initialData?: Partial<CustomerFormData>;
}

export default function CustomerForm({ customerId, initialData }: Props) {
  const router = useRouter();
  const { storeId } = useAuth();
  const [form, setForm] = useState<CustomerFormData>({ ...INITIAL, ...initialData });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isEdit = !!customerId;

  const updateField = <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toTimestampOrNull = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!form.lastName.trim() || !form.firstName.trim()) {
      setMessage({ type: "error", text: "氏名は必須です。" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const saveData = {
        storeId,
        lastName: form.lastName,
        firstName: form.firstName,
        lastNameKana: form.lastNameKana,
        firstNameKana: form.firstNameKana,
        gender: form.gender,
        birthDate: toTimestampOrNull(form.birthDate),
        postalCode: form.postalCode,
        prefecture: form.prefecture,
        city: form.city,
        address: form.address,
        phone: form.phone,
        mobile: form.mobile,
        email: form.email,
        licenseNumber: form.licenseNumber,
        licenseExpiry: toTimestampOrNull(form.licenseExpiry),
        licenseType: form.licenseType,
        blackLevel: form.blackLevel,
        blackReason: form.blackReason,
        isAppMember: form.isAppMember,
        appMemberId: form.appMemberId,
        memo: form.memo,
        ...(isEdit ? {} : {
          totalRentals: 0,
          totalRevenue: 0,
          lastRentalDate: null,
        }),
      };

      if (isEdit) {
        await updateDocument("customers", customerId, saveData);
        setMessage({ type: "success", text: "更新しました。" });
      } else {
        await addDocument("customers", saveData);
        router.push("/customers");
      }
    } catch (err) {
      console.error("保存に失敗:", err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "顧客編集" : "顧客登録"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEdit ? "顧客情報を編集します" : "新しい顧客を登録します"}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-secondary">戻る</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${
          message.type === "success"
            ? "bg-green-900/50 border border-green-700 text-green-300"
            : "bg-red-900/50 border border-red-700 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* 基本情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">基本情報</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="form-label">姓 *</label>
                <input type="text" value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="form-input" placeholder="山田" />
              </div>
              <div>
                <label className="form-label">名 *</label>
                <input type="text" value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="form-input" placeholder="太郎" />
              </div>
              <div>
                <label className="form-label">セイ</label>
                <input type="text" value={form.lastNameKana}
                  onChange={(e) => updateField("lastNameKana", e.target.value)}
                  className="form-input" placeholder="ヤマダ" />
              </div>
              <div>
                <label className="form-label">メイ</label>
                <input type="text" value={form.firstNameKana}
                  onChange={(e) => updateField("firstNameKana", e.target.value)}
                  className="form-input" placeholder="タロウ" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">性別</label>
                <select value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value as "male" | "female" | "other")}
                  className="form-select">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div>
                <label className="form-label">生年月日</label>
                <input type="date" value={form.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">メールアドレス</label>
                <input type="email" value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="form-input" placeholder="example@mail.com" />
              </div>
            </div>
          </div>
        </section>

        {/* 住所 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">住所</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">郵便番号</label>
                <input type="text" value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className="form-input" placeholder="000-0000" />
              </div>
              <div>
                <label className="form-label">都道府県</label>
                <input type="text" value={form.prefecture}
                  onChange={(e) => updateField("prefecture", e.target.value)}
                  className="form-input" placeholder="東京都" />
              </div>
              <div>
                <label className="form-label">市区町村</label>
                <input type="text" value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="form-input" placeholder="渋谷区" />
              </div>
            </div>
            <div>
              <label className="form-label">番地以降</label>
              <input type="text" value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="form-input" placeholder="1-2-3 ○○マンション 101" />
            </div>
          </div>
        </section>

        {/* 連絡先 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">連絡先</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">電話番号</label>
                <input type="text" value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="form-input" placeholder="03-1234-5678" />
              </div>
              <div>
                <label className="form-label">携帯番号</label>
                <input type="text" value={form.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                  className="form-input" placeholder="090-1234-5678" />
              </div>
            </div>
          </div>
        </section>

        {/* 免許情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">免許情報</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">免許証番号</label>
                <input type="text" value={form.licenseNumber}
                  onChange={(e) => updateField("licenseNumber", e.target.value)}
                  className="form-input" placeholder="123456789012" />
              </div>
              <div>
                <label className="form-label">有効期限</label>
                <input type="date" value={form.licenseExpiry}
                  onChange={(e) => updateField("licenseExpiry", e.target.value)}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">免許種別</label>
                <input type="text" value={form.licenseType}
                  onChange={(e) => updateField("licenseType", e.target.value)}
                  className="form-input" placeholder="普通" />
              </div>
            </div>
          </div>
        </section>

        {/* ブラックリスト・会員 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">管理情報</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">ブラックレベル</label>
                <select value={form.blackLevel}
                  onChange={(e) => updateField("blackLevel", Number(e.target.value) as BlackLevel)}
                  className="form-select">
                  {Object.entries(BLACK_LEVEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">ブラック理由</label>
                <input type="text" value={form.blackReason}
                  onChange={(e) => updateField("blackReason", e.target.value)}
                  className="form-input" placeholder="理由を記入" />
              </div>
            </div>

            <div className="flex gap-6 items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isAppMember}
                  onChange={(e) => updateField("isAppMember", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" />
                <span className="text-sm text-slate-300">アプリ会員</span>
              </label>
              {form.isAppMember && (
                <div className="flex-1">
                  <label className="form-label">会員ID</label>
                  <input type="text" value={form.appMemberId}
                    onChange={(e) => updateField("appMemberId", e.target.value)}
                    className="form-input" placeholder="会員ID" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 備考 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">備考</h2>
          </div>
          <div className="card-body">
            <textarea value={form.memo}
              onChange={(e) => updateField("memo", e.target.value)}
              className="form-input h-24 resize-none"
              placeholder="メモ・備考を入力" />
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2 pb-8">
          <button onClick={() => router.back()} className="btn btn-secondary">キャンセル</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
