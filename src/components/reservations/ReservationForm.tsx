"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  addDocument, updateDocument, getByStore, generateReservationNumber,
  generateContractNumber, getPricingPlansByClass, getActiveOptions, calculateBestPrice,
} from "@/lib/firestore";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Vehicle,
  Customer,
  PricingPlan,
  OptionMaster,
  VehicleClass,
  ReservationSource,
  ReservationStatus,
  PaymentMethod,
  RentalOption,
  AdditionalDriver,
  VEHICLE_CLASS_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types";

interface ReservationFormData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleClass: VehicleClass;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  source: ReservationSource;
  status: ReservationStatus;
  pricingClass: VehicleClass;
  basePrice: number;
  optionPrice: number;
  deliveryFee: number;
  discount: number;
  totalPrice: number;
  depositAmount: number;
  paymentMethod: PaymentMethod;
  options: RentalOption[];
  additionalDrivers: AdditionalDriver[];
  identityVerification: string;
  memo: string;
}

const INITIAL: ReservationFormData = {
  customerId: "",
  customerName: "",
  customerPhone: "",
  vehicleId: "",
  vehiclePlate: "",
  vehicleModel: "",
  vehicleClass: "compact",
  startDate: "",
  startTime: "10:00",
  endDate: "",
  endTime: "10:00",
  source: "phone",
  status: "approved",
  pricingClass: "compact",
  basePrice: 0,
  optionPrice: 0,
  deliveryFee: 0,
  discount: 0,
  totalPrice: 0,
  depositAmount: 0,
  paymentMethod: "cash",
  options: [],
  additionalDrivers: [],
  identityVerification: "",
  memo: "",
};

interface Props {
  reservationId?: string;
  initialData?: Partial<ReservationFormData>;
}

export default function ReservationForm({ reservationId, initialData }: Props) {
  const router = useRouter();
  const { storeId, userData } = useAuth();
  const [form, setForm] = useState<ReservationFormData>({ ...INITIAL, ...initialData });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [vehicles, setVehicles] = useState<(Vehicle & { id: string })[]>([]);
  const [customers, setCustomers] = useState<(Customer & { id: string })[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [pricingPlans, setPricingPlans] = useState<(PricingPlan & { id: string })[]>([]);
  const [optionMasters, setOptionMasters] = useState<(OptionMaster & { id: string })[]>([]);
  const [highSeasonPeriods, setHighSeasonPeriods] = useState<{ startDate: string; endDate: string; label: string }[]>([]);
  const [priceCalcInfo, setPriceCalcInfo] = useState<string>("");

  // 貸出開始
  const [showRentalStart, setShowRentalStart] = useState(false);
  const [departureMileage, setDepartureMileage] = useState(0);
  const [startingRental, setStartingRental] = useState(false);

  const isEdit = !!reservationId;

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // マスタデータ読み込み
  useEffect(() => {
    if (!storeId) return;
    const load = async () => {
      const [v, c, opts, storeSnap] = await Promise.all([
        getByStore<Vehicle>("vehicles", storeId),
        getByStore<Customer>("customers", storeId),
        getActiveOptions(storeId) as Promise<(OptionMaster & { id: string })[]>,
        getDoc(doc(db, "stores", storeId)),
      ]);
      setVehicles(v.filter((x) => x.status === "active"));
      setCustomers(c);
      setOptionMasters(opts);
      if (storeSnap.exists()) {
        const periods = storeSnap.data().highSeasonPeriods ?? [];
        setHighSeasonPeriods(periods.map((p: { startDate: { toDate?: () => Date }; endDate: { toDate?: () => Date }; label: string }) => ({
          startDate: p.startDate?.toDate ? p.startDate.toDate().toISOString().slice(0, 10) : "",
          endDate: p.endDate?.toDate ? p.endDate.toDate().toISOString().slice(0, 10) : "",
          label: p.label,
        })));
      }
    };
    load();
  }, [storeId]);

  const updateField = <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 料金クラス変更時にプランを読み込む
  useEffect(() => {
    if (!storeId || !form.pricingClass) return;
    const loadPlans = async () => {
      try {
        const plans = await getPricingPlansByClass(storeId, form.pricingClass) as (PricingPlan & { id: string })[];
        console.log("[料金プラン] storeId:", storeId, "class:", form.pricingClass, "件数:", plans.length, plans);
        setPricingPlans(plans);
      } catch (err) {
        console.error("[料金プラン] 取得エラー:", err);
      }
    };
    loadPlans();
  }, [storeId, form.pricingClass]);

  // ハイシーズン判定
  const checkHighSeason = (startDate: string): boolean => {
    if (!startDate || highSeasonPeriods.length === 0) return false;
    return highSeasonPeriods.some((p) => startDate >= p.startDate && startDate <= p.endDate);
  };

  // レンタル日数計算
  const calcRentalDays = (startDate: string, startTime: string, endDate: string, endTime: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  // 料金自動計算（日付・クラス・プラン変更時）
  useEffect(() => {
    if (!form.startDate || !form.endDate || pricingPlans.length === 0) {
      setPriceCalcInfo("");
      return;
    }

    const rentalDays = calcRentalDays(form.startDate, form.startTime, form.endDate, form.endTime);
    const isHighSeason = checkHighSeason(form.startDate);
    const result = calculateBestPrice(pricingPlans, rentalDays, isHighSeason);

    const bestPlan = pricingPlans[result.planIndex];
    const info = `${rentalDays}日間 / ${bestPlan?.name ?? ""}${isHighSeason ? " (ハイシーズン)" : ""} → ${result.totalPrice.toLocaleString()}円`;
    setPriceCalcInfo(info);

    setForm((prev) => ({ ...prev, basePrice: result.totalPrice }));
  }, [form.startDate, form.startTime, form.endDate, form.endTime, pricingPlans]);

  // 合計金額の自動計算
  useEffect(() => {
    const optionTotal = form.options.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);
    const total = form.basePrice + optionTotal + form.deliveryFee - form.discount;
    setForm((prev) => ({
      ...prev,
      optionPrice: optionTotal,
      totalPrice: Math.max(0, total),
    }));
  }, [form.basePrice, form.options, form.deliveryFee, form.discount]);

  // 顧客選択
  const selectCustomer = (c: Customer & { id: string }) => {
    setForm((prev) => ({
      ...prev,
      customerId: c.id,
      customerName: `${c.lastName} ${c.firstName}`,
      customerPhone: c.mobile || c.phone,
    }));
    setCustomerSearch(`${c.lastName} ${c.firstName}`);
    setShowCustomerList(false);
  };

  // 車両選択
  const selectVehicle = (vid: string) => {
    const v = vehicles.find((x) => x.id === vid);
    if (!v) return;
    setForm((prev) => ({
      ...prev,
      vehicleId: v.id,
      vehiclePlate: v.plateNumber,
      vehicleModel: `${v.maker} ${v.model}`,
      vehicleClass: v.vehicleClass,
      pricingClass: v.vehicleClass,
    }));
  };

  // オプション追加・削除
  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { name: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const updateOption = (index: number, field: keyof RentalOption, value: string | number) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], [field]: value };
      return { ...prev, options: opts };
    });
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // 追加運転者
  const addDriver = () => {
    setForm((prev) => ({
      ...prev,
      additionalDrivers: [...prev.additionalDrivers, { name: "", licenseNumber: "" }],
    }));
  };

  const updateDriver = (index: number, field: keyof AdditionalDriver, value: string) => {
    setForm((prev) => {
      const drivers = [...prev.additionalDrivers];
      drivers[index] = { ...drivers[index], [field]: value };
      return { ...prev, additionalDrivers: drivers };
    });
  };

  const removeDriver = (index: number) => {
    setForm((prev) => ({
      ...prev,
      additionalDrivers: prev.additionalDrivers.filter((_, i) => i !== index),
    }));
  };

  // 顧客フィルター
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      `${c.lastName}${c.firstName}`.includes(q) ||
      `${c.lastNameKana}${c.firstNameKana}`.includes(q) ||
      c.phone?.includes(q) ||
      c.mobile?.includes(q)
    );
  }).slice(0, 10);

  // 保存
  const handleSave = async () => {
    if (!storeId) return;
    if (!form.customerId) {
      setMessage({ type: "error", text: "顧客を選択してください。" });
      return;
    }
    if (!form.vehicleId) {
      setMessage({ type: "error", text: "車両を選択してください。" });
      return;
    }
    if (!form.startDate || !form.endDate) {
      setMessage({ type: "error", text: "貸出日時と返却予定日時を入力してください。" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

      const saveData = {
        storeId,
        customerId: form.customerId,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        vehicleId: form.vehicleId,
        vehiclePlate: form.vehiclePlate,
        vehicleModel: form.vehicleModel,
        vehicleClass: form.vehicleClass,
        startDate: startDateTime,
        endDate: endDateTime,
        source: form.source,
        status: form.status,
        isLocked: false,
        isEndDateBlocked: false,
        pricingClass: form.pricingClass,
        options: form.options,
        basePrice: form.basePrice,
        optionPrice: form.optionPrice,
        deliveryFee: form.deliveryFee,
        discount: form.discount,
        totalPrice: form.totalPrice,
        depositAmount: form.depositAmount,
        paymentMethod: form.paymentMethod,
        staffId: userData?.id ?? "",
        staffName: userData?.name ?? "",
        additionalDrivers: form.additionalDrivers,
        identityVerification: form.identityVerification,
        cancelledAt: null,
        cancelReason: "",
        cancelFee: 0,
        memo: form.memo,
        ...(isEdit ? {} : { reservationNumber: generateReservationNumber() }),
      };

      if (isEdit) {
        await updateDocument("reservations", reservationId, saveData);
        setMessage({ type: "success", text: "更新しました。" });
      } else {
        await addDocument("reservations", saveData);
        router.push("/reservations");
      }
    } catch (err) {
      console.error("保存に失敗:", err);
      setMessage({ type: "error", text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  // 貸出開始処理
  const handleStartRental = async () => {
    if (!storeId || !reservationId) return;
    setStartingRental(true);
    setMessage(null);
    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

      const batch = writeBatch(db);

      // 1. rentals に新規ドキュメント作成
      const rentalRef = doc(collection(db, "rentals"));
      batch.set(rentalRef, {
        storeId,
        reservationId,
        contractNumber: generateContractNumber(),
        customerId: form.customerId,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        vehicleId: form.vehicleId,
        vehiclePlate: form.vehiclePlate,
        vehicleModel: form.vehicleModel,
        vehicleClass: form.vehicleClass,
        startDate: startDateTime,
        endDate: endDateTime,
        actualReturnDate: null,
        departureMileage,
        returnMileage: null,
        fuelLevelAtReturn: "",
        status: "active",
        isEndDateBlocked: false,
        isLocked: false,
        pricingClass: form.pricingClass,
        options: form.options,
        basePrice: form.basePrice,
        optionPrice: form.optionPrice,
        deliveryFee: form.deliveryFee,
        discount: form.discount,
        totalPrice: form.totalPrice,
        totalPaid: form.depositAmount,
        balance: form.totalPrice - form.depositAmount,
        paymentMethod: form.paymentMethod,
        staffId: userData?.id ?? "",
        staffName: userData?.name ?? "",
        additionalDrivers: form.additionalDrivers,
        pickupType: "store",
        returnType: "store",
        identityVerification: form.identityVerification,
        extensions: [],
        vehicleReplacements: [],
        memo: form.memo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. 予約ステータスを converted_to_rental に更新
      const reservationRef = doc(db, "reservations", reservationId);
      batch.update(reservationRef, {
        status: "converted_to_rental",
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // 貸出詳細に遷移
      router.push(`/rentals/${rentalRef.id}`);
    } catch (err) {
      console.error("貸出開始に失敗:", err);
      setMessage({ type: "error", text: "貸出開始に失敗しました。" });
    } finally {
      setStartingRental(false);
    }
  };

  const canStartRental = isEdit && form.status === "approved";

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "予約編集" : "新規予約"}
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-secondary">戻る</button>
          {canStartRental && (
            <button onClick={() => setShowRentalStart(true)}
              className="btn bg-green-600 hover:bg-green-500 text-white">
              貸出開始
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "保存中..." : isEdit ? "更新する" : "予約登録"}
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
        {/* 顧客選択 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">顧客</h2>
          </div>
          <div className="card-body space-y-3">
            <div className="relative" ref={customerDropdownRef}>
              <label className="form-label">顧客検索 *</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerList(true);
                  if (!e.target.value) {
                    updateField("customerId", "");
                    updateField("customerName", "");
                    updateField("customerPhone", "");
                  }
                }}
                onFocus={() => setShowCustomerList(true)}
                className="form-input"
                placeholder="氏名・カナ・電話番号で検索..."
              />
              {showCustomerList && !form.customerId && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                      >
                        <div className="text-white font-medium">{c.lastName} {c.firstName}</div>
                        <div className="text-slate-400 text-xs">
                          {c.lastNameKana} {c.firstNameKana} | {c.mobile || c.phone || "電話番号なし"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-500 text-sm">該当する顧客がいません</div>
                  )}
                </div>
              )}
            </div>
            {form.customerId && (
              <div className="flex items-center gap-4 bg-slate-800 rounded-lg px-4 py-3">
                <span className="text-white font-medium">{form.customerName}</span>
                <span className="text-slate-400 text-sm">{form.customerPhone}</span>
                <button onClick={() => { updateField("customerId", ""); setCustomerSearch(""); }}
                  className="ml-auto text-slate-500 hover:text-red-400 text-sm">解除</button>
              </div>
            )}
          </div>
        </section>

        {/* 車両選択 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">車両</h2>
          </div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">車両選択 *</label>
              <select
                value={form.vehicleId}
                onChange={(e) => selectVehicle(e.target.value)}
                className="form-select"
              >
                <option value="">-- 車両を選択 --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {VEHICLE_CLASS_LABELS[v.vehicleClass]} - {v.maker} {v.model}
                  </option>
                ))}
              </select>
            </div>
            {form.vehicleId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">料金クラス</label>
                  <select value={form.pricingClass}
                    onChange={(e) => updateField("pricingClass", e.target.value as VehicleClass)}
                    className="form-select">
                    {Object.entries(VEHICLE_CLASS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 期間 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">貸出期間</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="form-label">貸出日時 *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="form-input" />
                  <input type="time" value={form.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className="form-input" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="form-label">返却予定日時 *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="form-input" />
                  <input type="time" value={form.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    className="form-input" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 予約情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">予約情報</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">予約経路</label>
                <select value={form.source}
                  onChange={(e) => updateField("source", e.target.value as ReservationSource)}
                  className="form-select">
                  {Object.entries(RESERVATION_SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">ステータス</label>
                <select value={form.status}
                  onChange={(e) => updateField("status", e.target.value as ReservationStatus)}
                  className="form-select">
                  {Object.entries(RESERVATION_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">本人確認書類</label>
                <input type="text" value={form.identityVerification}
                  onChange={(e) => updateField("identityVerification", e.target.value)}
                  className="form-input" placeholder="運転免許証" />
              </div>
            </div>
          </div>
        </section>

        {/* 料金プラン一覧 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">
              料金プラン（{VEHICLE_CLASS_LABELS[form.pricingClass]}）
            </h2>
          </div>
          <div className="card-body space-y-3">
            {pricingPlans.length === 0 ? (
              <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-700/50 rounded-lg px-4 py-3">
                この車種クラス（{VEHICLE_CLASS_LABELS[form.pricingClass]}）の料金プランが未登録です。設定 → 料金プランから登録してください。
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>プラン名</th>
                      <th>期間</th>
                      <th className="text-right">基本料金</th>
                      <th className="text-right">ハイシーズン</th>
                      <th className="text-right">超過/日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td className="text-white font-medium">{plan.name}</td>
                        <td className="text-slate-400">{plan.durationDays}日</td>
                        <td className="text-right text-white">{plan.basePrice.toLocaleString()}円</td>
                        <td className="text-right text-amber-400">{plan.highSeasonPrice.toLocaleString()}円</td>
                        <td className="text-right text-slate-400">{plan.perExtraDayPrice.toLocaleString()}円</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>* 貸出日数に応じて最安値のプラン組み合わせが自動適用されます。</p>
                  <p>* プラン期間超過分は「超過/日」料金が加算されます。</p>
                  <p>* ハイシーズン期間中はハイシーズン料金が適用されます。</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 料金 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">料金</h2>
          </div>
          <div className="card-body space-y-4">
            {priceCalcInfo && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-2.5 text-sm text-blue-300">
                自動計算: {priceCalcInfo}
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="form-label">基本料金 (円)</label>
                <input type="number" value={form.basePrice}
                  onChange={(e) => updateField("basePrice", Number(e.target.value))}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">配車料金 (円)</label>
                <input type="number" value={form.deliveryFee}
                  onChange={(e) => updateField("deliveryFee", Number(e.target.value))}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">値引き (円)</label>
                <input type="number" value={form.discount}
                  onChange={(e) => updateField("discount", Number(e.target.value))}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">前受金 (円)</label>
                <input type="number" value={form.depositAmount}
                  onChange={(e) => updateField("depositAmount", Number(e.target.value))}
                  className="form-input" />
              </div>
            </div>

            {/* オプション（マスタから選択） */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">オプション</label>
                <button onClick={addOption} className="text-blue-400 hover:text-blue-300 text-sm">
                  + 手動追加
                </button>
              </div>
              {optionMasters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {optionMasters.map((om) => {
                    const isSelected = form.options.some((o) => o.name === om.name);
                    return (
                      <button key={om.id}
                        onClick={() => {
                          if (isSelected) {
                            setForm((prev) => ({
                              ...prev,
                              options: prev.options.filter((o) => o.name !== om.name),
                            }));
                          } else {
                            setForm((prev) => ({
                              ...prev,
                              options: [...prev.options, { name: om.name, quantity: 1, unitPrice: om.unitPrice }],
                            }));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        {om.name} ({om.unitPrice.toLocaleString()}円)
                      </button>
                    );
                  })}
                </div>
              )}
              {form.options.map((opt, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <input type="text" value={opt.name}
                    onChange={(e) => updateOption(i, "name", e.target.value)}
                    className="form-input col-span-2" placeholder="オプション名" />
                  <input type="number" value={opt.unitPrice}
                    onChange={(e) => updateOption(i, "unitPrice", Number(e.target.value))}
                    className="form-input" placeholder="単価" />
                  <div className="flex gap-2">
                    <input type="number" value={opt.quantity}
                      onChange={(e) => updateOption(i, "quantity", Number(e.target.value))}
                      className="form-input" placeholder="数量" min={1} />
                    <button onClick={() => removeOption(i)}
                      className="text-slate-500 hover:text-red-400 px-2">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">支払方法</label>
                <select value={form.paymentMethod}
                  onChange={(e) => updateField("paymentMethod", e.target.value as PaymentMethod)}
                  className="form-select">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="bg-slate-800 rounded-lg px-6 py-3 w-full text-right">
                  <span className="text-slate-400 text-sm mr-3">合計金額</span>
                  <span className="text-2xl font-bold text-white">
                    {form.totalPrice.toLocaleString()}
                  </span>
                  <span className="text-slate-400 ml-1">円</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 追加運転者 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">追加運転者</h2>
            <button onClick={addDriver} className="text-blue-400 hover:text-blue-300 text-sm">
              + 追加
            </button>
          </div>
          <div className="card-body">
            {form.additionalDrivers.length === 0 ? (
              <p className="text-slate-500 text-sm">追加運転者はいません</p>
            ) : (
              form.additionalDrivers.map((d, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <input type="text" value={d.name}
                    onChange={(e) => updateDriver(i, "name", e.target.value)}
                    className="form-input" placeholder="運転者名" />
                  <input type="text" value={d.licenseNumber}
                    onChange={(e) => updateDriver(i, "licenseNumber", e.target.value)}
                    className="form-input" placeholder="免許証番号" />
                  <button onClick={() => removeDriver(i)}
                    className="text-slate-500 hover:text-red-400 text-sm justify-self-start">
                    削除
                  </button>
                </div>
              ))
            )}
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
            {saving ? "保存中..." : isEdit ? "更新する" : "予約登録"}
          </button>
        </div>
      </div>

      {/* 貸出開始モーダル */}
      {showRentalStart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowRentalStart(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">貸出開始</h3>
            <p className="text-slate-400 text-sm mb-4">
              この予約を貸出に変換します。出発メーターを入力してください。
            </p>
            <div className="space-y-4">
              <div>
                <label className="form-label">顧客</label>
                <p className="text-white">{form.customerName}</p>
              </div>
              <div>
                <label className="form-label">車両</label>
                <p className="text-white">{form.vehiclePlate} - {form.vehicleModel}</p>
              </div>
              <div>
                <label className="form-label">出発メーター (km)</label>
                <input type="number" value={departureMileage}
                  onChange={(e) => setDepartureMileage(Number(e.target.value))}
                  className="form-input" placeholder="出発時の走行距離" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRentalStart(false)} className="btn btn-secondary">
                キャンセル
              </button>
              <button onClick={handleStartRental} disabled={startingRental}
                className="btn bg-green-600 hover:bg-green-500 text-white">
                {startingRental ? "処理中..." : "貸出開始"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
