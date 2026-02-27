"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Store, CreditCardBrand } from "@/types";

const CREDIT_CARD_BRANDS: { value: CreditCardBrand; label: string }[] = [
  { value: "visa", label: "VISA" },
  { value: "mastercard", label: "Mastercard" },
  { value: "jcb", label: "JCB" },
  { value: "amex", label: "AMEX" },
  { value: "diners", label: "Diners" },
];

const INITIAL_STORE: Omit<Store, "createdAt" | "updatedAt"> = {
  name: "", postalCode: "", prefecture: "", city: "", address: "",
  phone: "", fax: "", email: "", openTime: "09:00", closeTime: "19:00",
  regularHoliday: "", imageUrl: "", acceptedCards: [],
  bankInfo: { bankName: "", branchName: "", accountType: "普通", accountNumber: "", accountHolder: "" },
  contractInfo: { companyName: "", representative: "", registrationNumber: "" },
  posReceiptPrinterIp: "", transportBureau: "", highSeasonPeriods: [],
};

export default function StoreSettingsTab() {
  const { storeId } = useAuth();
  const [form, setForm] = useState(INITIAL_STORE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "stores", storeId));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            name: d.name ?? "", postalCode: d.postalCode ?? "", prefecture: d.prefecture ?? "",
            city: d.city ?? "", address: d.address ?? "", phone: d.phone ?? "", fax: d.fax ?? "",
            email: d.email ?? "", openTime: d.openTime ?? "09:00", closeTime: d.closeTime ?? "19:00",
            regularHoliday: d.regularHoliday ?? "", imageUrl: d.imageUrl ?? "",
            acceptedCards: d.acceptedCards ?? [],
            bankInfo: {
              bankName: d.bankInfo?.bankName ?? "", branchName: d.bankInfo?.branchName ?? "",
              accountType: d.bankInfo?.accountType ?? "普通", accountNumber: d.bankInfo?.accountNumber ?? "",
              accountHolder: d.bankInfo?.accountHolder ?? "",
            },
            contractInfo: {
              companyName: d.contractInfo?.companyName ?? "", representative: d.contractInfo?.representative ?? "",
              registrationNumber: d.contractInfo?.registrationNumber ?? "",
            },
            posReceiptPrinterIp: d.posReceiptPrinterIp ?? "", transportBureau: d.transportBureau ?? "",
            highSeasonPeriods: d.highSeasonPeriods ?? [],
          });
        } else { setIsNew(true); }
      } catch { setMessage({ type: "error", text: "読み込みに失敗しました。" }); }
      finally { setLoading(false); }
    };
    load();
  }, [storeId]);

  const updateField = (field: string, value: string | string[]) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateBankInfo = (field: string, value: string) => setForm((prev) => ({ ...prev, bankInfo: { ...prev.bankInfo, [field]: value } }));
  const updateContractInfo = (field: string, value: string) => setForm((prev) => ({ ...prev, contractInfo: { ...prev.contractInfo, [field]: value } }));
  const toggleCard = (brand: CreditCardBrand) => setForm((prev) => {
    const cards = prev.acceptedCards.includes(brand) ? prev.acceptedCards.filter((c) => c !== brand) : [...prev.acceptedCards, brand];
    return { ...prev, acceptedCards: cards };
  });

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true); setMessage(null);
    try {
      await setDoc(doc(db, "stores", storeId), { ...form, updatedAt: serverTimestamp(), ...(isNew ? { createdAt: serverTimestamp() } : {}) }, { merge: true });
      setIsNew(false);
      setMessage({ type: "success", text: "保存しました。" });
      setTimeout(() => setMessage(null), 3000);
    } catch { setMessage({ type: "error", text: "保存に失敗しました。" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-end mb-4">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? "保存中..." : isNew ? "登録する" : "保存する"}
        </button>
      </div>
      {message && <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>{message.text}</div>}

      <div className="space-y-6">
        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">基本情報</h2></div>
          <div className="card-body space-y-4">
            <div><label className="form-label">店舗名</label><input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="form-input" placeholder="○○レンタカー ○○店" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="form-label">郵便番号</label><input type="text" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} className="form-input" placeholder="000-0000" /></div>
              <div><label className="form-label">都道府県</label><input type="text" value={form.prefecture} onChange={(e) => updateField("prefecture", e.target.value)} className="form-input" placeholder="東京都" /></div>
              <div><label className="form-label">市区町村</label><input type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)} className="form-input" placeholder="渋谷区" /></div>
            </div>
            <div><label className="form-label">番地以降</label><input type="text" value={form.address} onChange={(e) => updateField("address", e.target.value)} className="form-input" placeholder="1-2-3 ○○ビル 1F" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="form-label">電話番号</label><input type="text" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="form-input" placeholder="03-1234-5678" /></div>
              <div><label className="form-label">FAX番号</label><input type="text" value={form.fax} onChange={(e) => updateField("fax", e.target.value)} className="form-input" placeholder="03-1234-5679" /></div>
              <div><label className="form-label">メールアドレス</label><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="form-input" placeholder="info@example.com" /></div>
            </div>
          </div>
        </section>

        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">営業時間</h2></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">営業開始</label><input type="time" value={form.openTime} onChange={(e) => updateField("openTime", e.target.value)} className="form-input" /></div>
              <div><label className="form-label">営業終了</label><input type="time" value={form.closeTime} onChange={(e) => updateField("closeTime", e.target.value)} className="form-input" /></div>
            </div>
            <div><label className="form-label">定休日</label><input type="text" value={form.regularHoliday} onChange={(e) => updateField("regularHoliday", e.target.value)} className="form-input" placeholder="年中無休 / 毎週水曜日 など" /></div>
          </div>
        </section>

        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">対応クレジットカード</h2></div>
          <div className="card-body"><div className="flex flex-wrap gap-3">
            {CREDIT_CARD_BRANDS.map((brand) => (
              <label key={brand.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${form.acceptedCards.includes(brand.value) ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                <input type="checkbox" checked={form.acceptedCards.includes(brand.value)} onChange={() => toggleCard(brand.value)} className="sr-only" />
                <span className="text-sm font-medium">{brand.label}</span>
              </label>
            ))}
          </div></div>
        </section>

        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">銀行口座情報</h2></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">金融機関名</label><input type="text" value={form.bankInfo.bankName} onChange={(e) => updateBankInfo("bankName", e.target.value)} className="form-input" placeholder="○○銀行" /></div>
              <div><label className="form-label">支店名</label><input type="text" value={form.bankInfo.branchName} onChange={(e) => updateBankInfo("branchName", e.target.value)} className="form-input" placeholder="○○支店" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="form-label">口座種類</label><select value={form.bankInfo.accountType} onChange={(e) => updateBankInfo("accountType", e.target.value)} className="form-select"><option value="普通">普通</option><option value="当座">当座</option></select></div>
              <div><label className="form-label">口座番号</label><input type="text" value={form.bankInfo.accountNumber} onChange={(e) => updateBankInfo("accountNumber", e.target.value)} className="form-input" placeholder="1234567" /></div>
              <div><label className="form-label">口座名義</label><input type="text" value={form.bankInfo.accountHolder} onChange={(e) => updateBankInfo("accountHolder", e.target.value)} className="form-input" placeholder="カ）○○レンタカー" /></div>
            </div>
          </div>
        </section>

        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">契約書情報</h2></div>
          <div className="card-body"><div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">会社名</label><input type="text" value={form.contractInfo.companyName} onChange={(e) => updateContractInfo("companyName", e.target.value)} className="form-input" placeholder="株式会社○○" /></div>
            <div><label className="form-label">代表者名</label><input type="text" value={form.contractInfo.representative} onChange={(e) => updateContractInfo("representative", e.target.value)} className="form-input" placeholder="山田太郎" /></div>
            <div><label className="form-label">登録番号</label><input type="text" value={form.contractInfo.registrationNumber} onChange={(e) => updateContractInfo("registrationNumber", e.target.value)} className="form-input" placeholder="T1234567890123" /></div>
          </div></div>
        </section>

        <section className="card"><div className="card-header"><h2 className="text-lg font-semibold text-white">その他</h2></div>
          <div className="card-body"><div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">運輸支局名</label><input type="text" value={form.transportBureau} onChange={(e) => updateField("transportBureau", e.target.value)} className="form-input" placeholder="関東運輸局 東京運輸支局" /></div>
            <div><label className="form-label">POSレジ プリンタIP</label><input type="text" value={form.posReceiptPrinterIp} onChange={(e) => updateField("posReceiptPrinterIp", e.target.value)} className="form-input" placeholder="192.168.1.100" /></div>
          </div></div>
        </section>

        <div className="flex justify-end pt-2 pb-8">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? "保存中..." : isNew ? "登録する" : "保存する"}</button>
        </div>
      </div>
    </div>
  );
}
