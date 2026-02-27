"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { addDocument, updateDocument } from "@/lib/firestore";
import {
  VehicleClass,
  FuelType,
  VehicleStatus,
  StandardEquipment,
  VEHICLE_CLASS_LABELS,
  FUEL_TYPE_LABELS,
  STANDARD_EQUIPMENT_LABELS,
} from "@/types";

interface VehicleFormData {
  vehicleClass: VehicleClass;
  maker: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  chassisNumber: string;
  displacement: number;
  fuelType: FuelType;
  transmission: "AT" | "MT";
  capacity: number;
  imageUrl: string;
  inspectionExpiry: string;
  legalInspectionExpiry: string;
  insuranceExpiry: string;
  leaseExpiry: string;
  leaseCompany: string;
  leaseMonthlyFee: number;
  oilChangeIntervalKm: number;
  lastOilChangeKm: number;
  lastOilChangeDate: string;
  currentMileage: number;
  status: VehicleStatus;
  suspendedReason: string;
  isDummy: boolean;
  webMinRentalDays: number;
  standardEquipment: StandardEquipment[];
  isNonSmoking: boolean;
  hasStudless: boolean;
  parkingCertNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  purchaseFrom: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageType: string;
  memo: string;
}

const INITIAL: VehicleFormData = {
  vehicleClass: "compact",
  maker: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  plateNumber: "",
  chassisNumber: "",
  displacement: 1500,
  fuelType: "gasoline",
  transmission: "AT",
  capacity: 5,
  imageUrl: "",
  inspectionExpiry: "",
  legalInspectionExpiry: "",
  insuranceExpiry: "",
  leaseExpiry: "",
  leaseCompany: "",
  leaseMonthlyFee: 0,
  oilChangeIntervalKm: 5000,
  lastOilChangeKm: 0,
  lastOilChangeDate: "",
  currentMileage: 0,
  status: "active",
  suspendedReason: "",
  isDummy: false,
  webMinRentalDays: 1,
  standardEquipment: [],
  isNonSmoking: true,
  hasStudless: false,
  parkingCertNumber: "",
  purchaseDate: "",
  purchasePrice: 0,
  purchaseFrom: "",
  insuranceCompany: "",
  policyNumber: "",
  coverageType: "",
  memo: "",
};

interface Props {
  vehicleId?: string;
  initialData?: Partial<VehicleFormData>;
}

export default function VehicleForm({ vehicleId, initialData }: Props) {
  const router = useRouter();
  const { storeId } = useAuth();
  const [form, setForm] = useState<VehicleFormData>({ ...INITIAL, ...initialData });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isEdit = !!vehicleId;

  const updateField = <K extends keyof VehicleFormData>(field: K, value: VehicleFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (eq: StandardEquipment) => {
    setForm((prev) => {
      const list = prev.standardEquipment.includes(eq)
        ? prev.standardEquipment.filter((e) => e !== eq)
        : [...prev.standardEquipment, eq];
      return { ...prev, standardEquipment: list };
    });
  };

  const toTimestampOrNull = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!form.plateNumber.trim()) {
      setMessage({ type: "error", text: "ナンバープレートは必須です。" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const saveData = {
        storeId,
        vehicleClass: form.vehicleClass,
        maker: form.maker,
        model: form.model,
        year: form.year,
        color: form.color,
        plateNumber: form.plateNumber,
        chassisNumber: form.chassisNumber,
        displacement: form.displacement,
        fuelType: form.fuelType,
        transmission: form.transmission,
        capacity: form.capacity,
        imageUrl: form.imageUrl,
        inspectionExpiry: toTimestampOrNull(form.inspectionExpiry),
        legalInspectionExpiry: toTimestampOrNull(form.legalInspectionExpiry),
        insuranceExpiry: toTimestampOrNull(form.insuranceExpiry),
        leaseExpiry: toTimestampOrNull(form.leaseExpiry),
        leaseCompany: form.leaseCompany,
        leaseMonthlyFee: form.leaseMonthlyFee,
        oilChangeIntervalKm: form.oilChangeIntervalKm,
        lastOilChangeKm: form.lastOilChangeKm,
        lastOilChangeDate: toTimestampOrNull(form.lastOilChangeDate),
        currentMileage: form.currentMileage,
        status: form.status,
        suspendedReason: form.suspendedReason,
        suspendedFrom: null,
        suspendedTo: null,
        sharedWithStores: [],
        isDummy: form.isDummy,
        webMinRentalDays: form.webMinRentalDays,
        standardEquipment: form.standardEquipment,
        isNonSmoking: form.isNonSmoking,
        hasStudless: form.hasStudless,
        parkingCertNumber: form.parkingCertNumber,
        purchaseInfo: {
          purchaseDate: toTimestampOrNull(form.purchaseDate),
          purchasePrice: form.purchasePrice,
          purchaseFrom: form.purchaseFrom,
        },
        insuranceInfo: {
          insuranceCompany: form.insuranceCompany,
          policyNumber: form.policyNumber,
          coverageType: form.coverageType,
        },
        memo: form.memo,
      };

      if (isEdit) {
        await updateDocument("vehicles", vehicleId, saveData);
        setMessage({ type: "success", text: "更新しました。" });
      } else {
        await addDocument("vehicles", saveData);
        router.push("/vehicles");
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "車両編集" : "車両登録"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEdit ? "車両情報を編集します" : "新しい車両を登録します"}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-secondary">
            戻る
          </button>
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">車種クラス *</label>
                <select
                  value={form.vehicleClass}
                  onChange={(e) => updateField("vehicleClass", e.target.value as VehicleClass)}
                  className="form-select"
                >
                  {Object.entries(VEHICLE_CLASS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">メーカー</label>
                <input
                  type="text"
                  value={form.maker}
                  onChange={(e) => updateField("maker", e.target.value)}
                  className="form-input"
                  placeholder="トヨタ"
                />
              </div>
              <div>
                <label className="form-label">車名</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className="form-input"
                  placeholder="ヤリス"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="form-label">ナンバープレート *</label>
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={(e) => updateField("plateNumber", e.target.value)}
                  className="form-input"
                  placeholder="品川 500 あ 1234"
                />
              </div>
              <div>
                <label className="form-label">年式</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => updateField("year", Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">色</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  className="form-input"
                  placeholder="ホワイト"
                />
              </div>
              <div>
                <label className="form-label">車台番号</label>
                <input
                  type="text"
                  value={form.chassisNumber}
                  onChange={(e) => updateField("chassisNumber", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="form-label">排気量 (cc)</label>
                <input
                  type="number"
                  value={form.displacement}
                  onChange={(e) => updateField("displacement", Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">燃料</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => updateField("fuelType", e.target.value as FuelType)}
                  className="form-select"
                >
                  {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">ミッション</label>
                <select
                  value={form.transmission}
                  onChange={(e) => updateField("transmission", e.target.value as "AT" | "MT")}
                  className="form-select"
                >
                  <option value="AT">AT</option>
                  <option value="MT">MT</option>
                </select>
              </div>
              <div>
                <label className="form-label">乗車定員</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">ステータス</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value as VehicleStatus)}
                  className="form-select"
                >
                  <option value="active">稼働中</option>
                  <option value="suspended">停止中</option>
                </select>
              </div>
              <div>
                <label className="form-label">現在走行距離 (km)</label>
                <input
                  type="number"
                  value={form.currentMileage}
                  onChange={(e) => updateField("currentMileage", Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 期限管理 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">期限管理</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">車検有効期限</label>
                <input
                  type="date"
                  value={form.inspectionExpiry}
                  onChange={(e) => updateField("inspectionExpiry", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">法定点検満了日</label>
                <input
                  type="date"
                  value={form.legalInspectionExpiry}
                  onChange={(e) => updateField("legalInspectionExpiry", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">保険満了日</label>
                <input
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={(e) => updateField("insuranceExpiry", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* リース情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">リース情報</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">リース会社</label>
                <input
                  type="text"
                  value={form.leaseCompany}
                  onChange={(e) => updateField("leaseCompany", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">リースアップ日</label>
                <input
                  type="date"
                  value={form.leaseExpiry}
                  onChange={(e) => updateField("leaseExpiry", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">リース月額 (円)</label>
                <input
                  type="number"
                  value={form.leaseMonthlyFee}
                  onChange={(e) => updateField("leaseMonthlyFee", Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* オイル交換管理 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">オイル交換管理</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">交換間隔 (km)</label>
                <input
                  type="number"
                  value={form.oilChangeIntervalKm}
                  onChange={(e) => updateField("oilChangeIntervalKm", Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">前回交換時走行距離 (km)</label>
                <input
                  type="number"
                  value={form.lastOilChangeKm}
                  onChange={(e) => updateField("lastOilChangeKm", Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">前回交換日</label>
                <input
                  type="date"
                  value={form.lastOilChangeDate}
                  onChange={(e) => updateField("lastOilChangeDate", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 装備・オプション */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">装備・オプション</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">標準装備</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(STANDARD_EQUIPMENT_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      form.standardEquipment.includes(key as StandardEquipment)
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.standardEquipment.includes(key as StandardEquipment)}
                      onChange={() => toggleEquipment(key as StandardEquipment)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNonSmoking}
                  onChange={(e) => updateField("isNonSmoking", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">禁煙車</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasStudless}
                  onChange={(e) => updateField("hasStudless", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">スタッドレス装備</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDummy}
                  onChange={(e) => updateField("isDummy", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">ダミー車両</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">WEB予約 最低貸出日数</label>
                <input
                  type="number"
                  value={form.webMinRentalDays}
                  onChange={(e) => updateField("webMinRentalDays", Number(e.target.value))}
                  className="form-input"
                  min={1}
                />
              </div>
              <div>
                <label className="form-label">車庫証明 保管場所標章番号</label>
                <input
                  type="text"
                  value={form.parkingCertNumber}
                  onChange={(e) => updateField("parkingCertNumber", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 仕入れ情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">仕入れ情報</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">仕入日</label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateField("purchaseDate", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">仕入額 (円)</label>
                <input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => updateField("purchasePrice", Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">仕入先</label>
                <input
                  type="text"
                  value={form.purchaseFrom}
                  onChange={(e) => updateField("purchaseFrom", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 保険情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">保険情報</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">保険会社</label>
                <input
                  type="text"
                  value={form.insuranceCompany}
                  onChange={(e) => updateField("insuranceCompany", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">証券番号</label>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={(e) => updateField("policyNumber", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">補償内容</label>
                <input
                  type="text"
                  value={form.coverageType}
                  onChange={(e) => updateField("coverageType", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 備考 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">備考</h2>
          </div>
          <div className="card-body">
            <textarea
              value={form.memo}
              onChange={(e) => updateField("memo", e.target.value)}
              className="form-input h-24 resize-none"
              placeholder="メモ・備考を入力"
            />
          </div>
        </section>

        {/* 保存ボタン（下部） */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <button onClick={() => router.back()} className="btn btn-secondary">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
