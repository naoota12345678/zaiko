"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { updateDocument, addDocument, getPaymentsByRental } from "@/lib/firestore";
import { printRentalCertificate } from "@/lib/printCertificate";
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Rental,
  RentalStatus,
  RentalExtension,
  ExtensionType,
  Payment,
  PaymentType,
  PaymentCategory,
  PaymentMethod,
  RENTAL_STATUS_LABELS,
  VEHICLE_CLASS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  EXTENSION_TYPE_LABELS,
} from "@/types";

interface Props {
  rental: Rental & { id: string };
}

function formatDateTime(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) +
    " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function formatDateOnly(val: Timestamp | null | undefined): string {
  if (!val) return "-";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

const STATUS_BADGE: Record<RentalStatus, string> = {
  active: "badge-blue",
  extended: "badge-amber",
  overdue: "badge-red",
  unreturned: "badge-red",
  returned: "badge-green",
  early_returned: "badge-green",
};

const PAYMENT_CATEGORY_LABELS: Record<string, string> = {
  deposit: "前受金",
  rental_payment: "レンタル代",
  cancel_fee_payment: "キャンセル料",
  early_return: "早期返却返金",
  overcharge: "過剰請求返金",
};

function getDisplayStatus(rental: Rental): { status: RentalStatus; label: string } {
  if (rental.status === "active" || rental.status === "extended") {
    const endDate = rental.endDate instanceof Timestamp
      ? rental.endDate.toDate()
      : new Date(rental.endDate as unknown as string);
    if (endDate < new Date()) {
      return { status: "overdue", label: RENTAL_STATUS_LABELS.overdue };
    }
  }
  return { status: rental.status, label: RENTAL_STATUS_LABELS[rental.status] };
}

export default function RentalDetailView({ rental }: Props) {
  const router = useRouter();
  const { userData, storeId } = useAuth();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 入金履歴
  const [payments, setPayments] = useState<(Payment & { id: string })[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // 入金フォーム
  const [payType, setPayType] = useState<"payment" | "refund">("payment");
  const [payCategory, setPayCategory] = useState<PaymentCategory>("rental_payment");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payBrand, setPayBrand] = useState("");
  const [payMemo, setPayMemo] = useState("");

  // 返却フォーム
  const [returnDate, setReturnDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [returnTime, setReturnTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [returnMileage, setReturnMileage] = useState<number>(rental.departureMileage ?? 0);
  const [fuelLevel, setFuelLevel] = useState("full");

  // 延長フォーム
  const [extensionType, setExtensionType] = useState<ExtensionType>("addition");
  const [newEndDate, setNewEndDate] = useState(() => {
    const end = rental.endDate instanceof Timestamp
      ? rental.endDate.toDate()
      : new Date(rental.endDate as unknown as string);
    const next = new Date(end);
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  });
  const [newEndTime, setNewEndTime] = useState(() => {
    const end = rental.endDate instanceof Timestamp
      ? rental.endDate.toDate()
      : new Date(rental.endDate as unknown as string);
    return end.toTimeString().slice(0, 5);
  });
  const [additionalPrice, setAdditionalPrice] = useState(0);

  const display = getDisplayStatus(rental);
  const isActive = ["active", "extended", "overdue", "unreturned"].includes(rental.status);

  // 入金履歴読み込み
  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const data = await getPaymentsByRental(rental.id);
      setPayments(data as (Payment & { id: string })[]);
    } catch (err) {
      console.error("入金履歴の取得に失敗:", err);
    } finally {
      setLoadingPayments(false);
    }
  }, [rental.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // カテゴリ選択肢
  const categoryOptions: { value: PaymentCategory; label: string }[] =
    payType === "payment"
      ? [
          { value: "deposit", label: "前受金" },
          { value: "rental_payment", label: "レンタル代" },
          { value: "cancel_fee_payment", label: "キャンセル料" },
        ]
      : [
          { value: "early_return", label: "早期返却返金" },
          { value: "overcharge", label: "過剰請求返金" },
        ];

  // 種別変更時にカテゴリをリセット
  const handlePayTypeChange = (type: "payment" | "refund") => {
    setPayType(type);
    setPayCategory(type === "payment" ? "rental_payment" : "early_return");
  };

  // 入金登録
  const handlePaymentSubmit = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "金額を入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await addDocument("payments", {
        storeId: rental.storeId,
        rentalId: rental.id,
        reservationId: rental.reservationId ?? null,
        customerId: rental.customerId,
        type: payType as PaymentType,
        category: payCategory,
        amount,
        method: payMethod,
        description: payMemo,
        brandName: payBrand,
        bankTransferDate: null,
        isCancelled: false,
        cancelledAt: null,
        cancelReason: "",
        staffId: userData?.id ?? "",
        staffName: userData?.name ?? "",
        transactionDate: Timestamp.now(),
      });

      // rental の totalPaid/balance を再計算
      const updatedPayments = await getPaymentsByRental(rental.id) as (Payment & { id: string })[];
      const totalPaid = updatedPayments
        .filter((p) => !p.isCancelled && p.type === "payment")
        .reduce((sum, p) => sum + p.amount, 0);
      const totalRefund = updatedPayments
        .filter((p) => !p.isCancelled && p.type === "refund")
        .reduce((sum, p) => sum + p.amount, 0);
      const netPaid = totalPaid - totalRefund;
      const balance = (rental.totalPrice ?? 0) - netPaid;

      await updateDocument("rentals", rental.id, {
        totalPaid: netPaid,
        balance,
      });

      setPayments(updatedPayments);
      setMessage({ type: "success", text: "入金を登録しました。" });
      setShowPaymentModal(false);
      setPayAmount("");
      setPayBrand("");
      setPayMemo("");
      setTimeout(() => router.refresh(), 500);
    } catch (err) {
      console.error("入金登録に失敗:", err);
      setMessage({ type: "error", text: "入金登録に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  // 入金取消
  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm("この入金を取り消しますか？")) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateDocument("payments", paymentId, {
        isCancelled: true,
        cancelledAt: Timestamp.now(),
        cancelReason: "取消処理",
      });

      // rental の totalPaid/balance を再計算
      const updatedPayments = await getPaymentsByRental(rental.id) as (Payment & { id: string })[];
      const totalPaid = updatedPayments
        .filter((p) => !p.isCancelled && p.type === "payment")
        .reduce((sum, p) => sum + p.amount, 0);
      const totalRefund = updatedPayments
        .filter((p) => !p.isCancelled && p.type === "refund")
        .reduce((sum, p) => sum + p.amount, 0);
      const netPaid = totalPaid - totalRefund;
      const balance = (rental.totalPrice ?? 0) - netPaid;

      await updateDocument("rentals", rental.id, {
        totalPaid: netPaid,
        balance,
      });

      setPayments(updatedPayments);
      setMessage({ type: "success", text: "入金を取り消しました。" });
      setTimeout(() => router.refresh(), 500);
    } catch (err) {
      console.error("入金取消に失敗:", err);
      setMessage({ type: "error", text: "入金取消に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  // 返却処理
  const handleReturn = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const actualReturn = new Date(`${returnDate}T${returnTime}`);
      const endDate = rental.endDate instanceof Timestamp
        ? rental.endDate.toDate()
        : new Date(rental.endDate as unknown as string);

      const isEarly = actualReturn < endDate;
      const newStatus: RentalStatus = isEarly ? "early_returned" : "returned";

      await updateDocument("rentals", rental.id, {
        status: newStatus,
        actualReturnDate: actualReturn,
        returnMileage,
        fuelLevelAtReturn: fuelLevel,
      });

      // 車両の走行距離を更新
      if (rental.vehicleId && returnMileage > 0) {
        const vehicleRef = doc(db, "vehicles", rental.vehicleId);
        await updateDoc(vehicleRef, {
          currentMileage: returnMileage,
          updatedAt: serverTimestamp(),
        });
      }

      setMessage({ type: "success", text: "返却処理が完了しました。" });
      setShowReturnModal(false);
      setTimeout(() => router.refresh(), 500);
    } catch (err) {
      console.error("返却処理に失敗:", err);
      setMessage({ type: "error", text: "返却処理に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  // 延長処理
  const handleExtend = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const newEnd = new Date(`${newEndDate}T${newEndTime}`);
      const extension: RentalExtension = {
        type: extensionType,
        previousEndDate: rental.endDate,
        newEndDate: Timestamp.fromDate(newEnd),
        additionalPrice,
        registeredAt: Timestamp.now(),
        staffId: userData?.id ?? "",
        staffName: userData?.name ?? "",
      };

      const updatedExtensions = [...(rental.extensions ?? []), extension];
      const newTotal = (rental.totalPrice ?? 0) + additionalPrice;
      const newBalance = newTotal - (rental.totalPaid ?? 0);

      await updateDocument("rentals", rental.id, {
        status: "extended",
        endDate: newEnd,
        extensions: updatedExtensions,
        totalPrice: newTotal,
        balance: newBalance,
      });

      setMessage({ type: "success", text: "延長処理が完了しました。" });
      setShowExtendModal(false);
      setTimeout(() => router.refresh(), 500);
    } catch (err) {
      console.error("延長処理に失敗:", err);
      setMessage({ type: "error", text: "延長処理に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  // 貸渡証印刷
  const handlePrintCertificate = async () => {
    try {
      if (!storeId) return;
      const storeSnap = await getDoc(doc(db, "stores", storeId));
      const storeData = storeSnap.exists() ? storeSnap.data() : {};
      printRentalCertificate(rental, {
        name: storeData.name ?? "",
        phone: storeData.phone ?? "",
        address: storeData.address ?? "",
        postalCode: storeData.postalCode ?? "",
        prefecture: storeData.prefecture ?? "",
        city: storeData.city ?? "",
        contractInfo: storeData.contractInfo,
        transportBureau: storeData.transportBureau,
      });
    } catch (err) {
      console.error("貸渡証の生成に失敗:", err);
      setMessage({ type: "error", text: "貸渡証の生成に失敗しました。" });
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">貸出詳細</h1>
          <p className="text-slate-400 text-sm mt-1">
            契約番号: {rental.contractNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-secondary">戻る</button>
          <button onClick={handlePrintCertificate} className="btn btn-secondary">
            貸渡証
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn btn-secondary">
            入金登録
          </button>
          {isActive && (
            <>
              <button onClick={() => setShowExtendModal(true)} className="btn btn-secondary">
                延長処理
              </button>
              <button onClick={() => setShowReturnModal(true)} className="btn btn-primary">
                返却処理
              </button>
            </>
          )}
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
            <span className={`badge ${STATUS_BADGE[display.status]}`}>{display.label}</span>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">顧客名</label>
                <p className="text-white font-medium">{rental.customerName}</p>
                <p className="text-slate-500 text-xs">{rental.customerPhone}</p>
              </div>
              <div>
                <label className="form-label">車両</label>
                <p className="text-white font-medium">{rental.vehiclePlate}</p>
                <p className="text-slate-500 text-xs">
                  {rental.vehicleModel} ({VEHICLE_CLASS_LABELS[rental.vehicleClass] ?? ""})
                </p>
              </div>
              <div>
                <label className="form-label">貸出日時</label>
                <p className="text-white">{formatDateTime(rental.startDate)}</p>
              </div>
              <div>
                <label className="form-label">返却予定日時</label>
                <p className="text-white">{formatDateTime(rental.endDate)}</p>
              </div>
              {rental.actualReturnDate && (
                <div>
                  <label className="form-label">実際の返却日時</label>
                  <p className="text-white">{formatDateTime(rental.actualReturnDate)}</p>
                </div>
              )}
              <div>
                <label className="form-label">出発メーター</label>
                <p className="text-white">{(rental.departureMileage ?? 0).toLocaleString()} km</p>
              </div>
              {rental.returnMileage != null && (
                <div>
                  <label className="form-label">返却メーター</label>
                  <p className="text-white">{rental.returnMileage.toLocaleString()} km</p>
                </div>
              )}
              {rental.fuelLevelAtReturn && (
                <div>
                  <label className="form-label">返却時燃料</label>
                  <p className="text-white">{rental.fuelLevelAtReturn}</p>
                </div>
              )}
              <div>
                <label className="form-label">受渡方法</label>
                <p className="text-white">
                  貸出: {LOCATION_TYPE_LABELS[rental.pickupType] ?? rental.pickupType ?? "店頭"} /
                  返却: {LOCATION_TYPE_LABELS[rental.returnType] ?? rental.returnType ?? "店頭"}
                </p>
              </div>
              <div>
                <label className="form-label">支払方法</label>
                <p className="text-white">{PAYMENT_METHOD_LABELS[rental.paymentMethod] ?? rental.paymentMethod}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 追加運転者 */}
        {rental.additionalDrivers && rental.additionalDrivers.length > 0 && (
          <section className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">追加運転者</h2>
            </div>
            <div className="card-body">
              {rental.additionalDrivers.map((d, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-white font-medium">{d.name}</span>
                  <span className="text-slate-400 text-sm">免許: {d.licenseNumber || "-"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 料金情報 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">料金情報</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">基本料金</span>
                <span className="text-white">{(rental.basePrice ?? 0).toLocaleString()}円</span>
              </div>

              {/* オプション明細 */}
              {rental.options && rental.options.length > 0 && (
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-slate-400 text-xs mb-2">オプション</p>
                  {rental.options.map((opt, i) => (
                    <div key={i} className="flex justify-between text-sm pl-4">
                      <span className="text-slate-300">
                        {opt.name} x{opt.quantity}
                      </span>
                      <span className="text-white">
                        {(opt.unitPrice * opt.quantity).toLocaleString()}円
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(rental.deliveryFee ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">配車料金</span>
                  <span className="text-white">{rental.deliveryFee.toLocaleString()}円</span>
                </div>
              )}

              {(rental.discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">値引き</span>
                  <span className="text-red-400">-{rental.discount.toLocaleString()}円</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between font-semibold">
                <span className="text-white">合計</span>
                <span className="text-white text-lg">{(rental.totalPrice ?? 0).toLocaleString()}円</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">入金済み</span>
                <span className="text-green-400">{(rental.totalPaid ?? 0).toLocaleString()}円</span>
              </div>

              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-400">残金</span>
                <span className={(rental.balance ?? 0) > 0 ? "text-amber-400" : "text-green-400"}>
                  {(rental.balance ?? 0).toLocaleString()}円
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 入金履歴 */}
        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">入金履歴</h2>
            <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary text-sm py-1 px-3">
              入金登録
            </button>
          </div>
          <div className="card-body">
            {loadingPayments ? (
              <p className="text-slate-500 text-sm">読み込み中...</p>
            ) : payments.length === 0 ? (
              <p className="text-slate-500 text-sm">入金履歴はありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日付</th>
                      <th>種別</th>
                      <th>カテゴリ</th>
                      <th className="text-right">金額</th>
                      <th>支払方法</th>
                      <th>担当</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className={p.isCancelled ? "opacity-40" : ""}>
                        <td className={`text-sm ${p.isCancelled ? "line-through" : "text-white"}`}>
                          {formatDateOnly(p.transactionDate)}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.type === "payment" ? "badge-green" :
                            p.type === "refund" ? "badge-amber" : "badge-slate"
                          }`}>
                            {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                          </span>
                        </td>
                        <td className={`text-sm ${p.isCancelled ? "line-through text-slate-500" : "text-slate-300"}`}>
                          {PAYMENT_CATEGORY_LABELS[p.category] ?? p.category}
                        </td>
                        <td className={`text-right text-sm font-medium ${
                          p.isCancelled ? "line-through text-slate-500" :
                          p.type === "refund" ? "text-red-400" : "text-white"
                        }`}>
                          {p.type === "refund" ? "-" : ""}{p.amount.toLocaleString()}円
                        </td>
                        <td className={`text-sm ${p.isCancelled ? "text-slate-500" : "text-slate-300"}`}>
                          {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                          {p.brandName ? ` (${p.brandName})` : ""}
                        </td>
                        <td className="text-sm text-slate-400">{p.staffName}</td>
                        <td>
                          {!p.isCancelled && (
                            <button
                              onClick={() => handleCancelPayment(p.id)}
                              disabled={saving}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              取消
                            </button>
                          )}
                          {p.isCancelled && (
                            <span className="text-xs text-slate-500">取消済</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 延長履歴 */}
        {rental.extensions && rental.extensions.length > 0 && (
          <section className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">延長履歴</h2>
            </div>
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>種別</th>
                    <th>変更前</th>
                    <th>変更後</th>
                    <th className="text-right">追加料金</th>
                    <th>登録日</th>
                    <th>担当</th>
                  </tr>
                </thead>
                <tbody>
                  {rental.extensions.map((ext, i) => (
                    <tr key={i}>
                      <td className="text-white">{EXTENSION_TYPE_LABELS[ext.type] ?? ext.type}</td>
                      <td className="text-slate-400 text-sm">{formatDateOnly(ext.previousEndDate)}</td>
                      <td className="text-white text-sm">{formatDateOnly(ext.newEndDate)}</td>
                      <td className="text-right text-white">{(ext.additionalPrice ?? 0).toLocaleString()}円</td>
                      <td className="text-slate-400 text-sm">{formatDateOnly(ext.registeredAt)}</td>
                      <td className="text-slate-400 text-sm">{ext.staffName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 備考 */}
        {rental.memo && (
          <section className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">備考</h2>
            </div>
            <div className="card-body">
              <p className="text-slate-300 whitespace-pre-wrap">{rental.memo}</p>
            </div>
          </section>
        )}
      </div>

      {/* 入金登録モーダル */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">入金登録</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">種別</label>
                <select value={payType}
                  onChange={(e) => handlePayTypeChange(e.target.value as "payment" | "refund")}
                  className="form-select">
                  <option value="payment">入金</option>
                  <option value="refund">返金</option>
                </select>
              </div>
              <div>
                <label className="form-label">カテゴリ</label>
                <select value={payCategory}
                  onChange={(e) => setPayCategory(e.target.value as PaymentCategory)}
                  className="form-select">
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">金額 (円)</label>
                <input type="number" value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="form-input" min={0} placeholder="0" />
              </div>
              <div>
                <label className="form-label">支払方法</label>
                <select value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="form-select">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">ブランド名 (任意)</label>
                <input type="text" value={payBrand}
                  onChange={(e) => setPayBrand(e.target.value)}
                  className="form-input" placeholder="Visa, Suica 等" />
              </div>
              <div>
                <label className="form-label">備考</label>
                <input type="text" value={payMemo}
                  onChange={(e) => setPayMemo(e.target.value)}
                  className="form-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                キャンセル
              </button>
              <button onClick={handlePaymentSubmit} disabled={saving} className="btn btn-primary">
                {saving ? "処理中..." : "登録"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 返却処理モーダル */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowReturnModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">返却処理</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">返却日時</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="form-input" />
                  <input type="time" value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">返却メーター (km)</label>
                <input type="number" value={returnMileage}
                  onChange={(e) => setReturnMileage(Number(e.target.value))}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">燃料レベル</label>
                <select value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  className="form-select">
                  <option value="full">満タン</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="empty">空</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowReturnModal(false)} className="btn btn-secondary">
                キャンセル
              </button>
              <button onClick={handleReturn} disabled={saving} className="btn btn-primary">
                {saving ? "処理中..." : "返却完了"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 延長処理モーダル */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowExtendModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">延長処理</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">延長種別</label>
                <select value={extensionType}
                  onChange={(e) => setExtensionType(e.target.value as ExtensionType)}
                  className="form-select">
                  {Object.entries(EXTENSION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">新しい返却日時</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="form-input" />
                  <input type="time" value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">追加料金 (円)</label>
                <input type="number" value={additionalPrice}
                  onChange={(e) => setAdditionalPrice(Number(e.target.value))}
                  className="form-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowExtendModal(false)} className="btn btn-secondary">
                キャンセル
              </button>
              <button onClick={handleExtend} disabled={saving} className="btn btn-primary">
                {saving ? "処理中..." : "延長確定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
