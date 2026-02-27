"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocument } from "@/lib/firestore";
import { Reservation } from "@/types";
import { Timestamp } from "firebase/firestore";
import ReservationForm from "@/components/reservations/ReservationForm";

function toDateStr(val: Timestamp | null | undefined): string {
  if (!val) return "";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val);
  return d.toISOString().slice(0, 10);
}

function toTimeStr(val: Timestamp | null | undefined): string {
  if (!val) return "10:00";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val);
  return d.toTimeString().slice(0, 5);
}

export default function EditReservationPage() {
  const params = useParams();
  const reservationId = params.id as string;
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDocument<Reservation>("reservations", reservationId);
        if (!data) { setNotFound(true); return; }

        setInitialData({
          customerId: data.customerId ?? "",
          customerName: data.customerName ?? "",
          customerPhone: data.customerPhone ?? "",
          vehicleId: data.vehicleId ?? "",
          vehiclePlate: data.vehiclePlate ?? "",
          vehicleModel: data.vehicleModel ?? "",
          vehicleClass: data.vehicleClass ?? "compact",
          startDate: toDateStr(data.startDate),
          startTime: toTimeStr(data.startDate),
          endDate: toDateStr(data.endDate),
          endTime: toTimeStr(data.endDate),
          source: data.source ?? "phone",
          status: data.status ?? "approved",
          pricingClass: data.pricingClass ?? data.vehicleClass ?? "compact",
          basePrice: data.basePrice ?? 0,
          optionPrice: data.optionPrice ?? 0,
          deliveryFee: data.deliveryFee ?? 0,
          discount: data.discount ?? 0,
          totalPrice: data.totalPrice ?? 0,
          depositAmount: data.depositAmount ?? 0,
          paymentMethod: data.paymentMethod ?? "cash",
          options: data.options ?? [],
          additionalDrivers: data.additionalDrivers ?? [],
          identityVerification: data.identityVerification ?? "",
          memo: data.memo ?? "",
        });
      } catch (err) {
        console.error("予約データの取得に失敗:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reservationId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-400 text-sm">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold text-slate-300">予約が見つかりません</h2>
      </div>
    );
  }

  return <ReservationForm reservationId={reservationId} initialData={initialData!} />;
}
