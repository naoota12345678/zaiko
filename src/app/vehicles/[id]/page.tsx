"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocument } from "@/lib/firestore";
import { Vehicle } from "@/types";
import { Timestamp } from "firebase/firestore";
import VehicleForm from "@/components/vehicles/VehicleForm";

function toDateString(val: Timestamp | Date | null | undefined): string {
  if (!val) return "";
  if (val instanceof Timestamp) {
    return val.toDate().toISOString().slice(0, 10);
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  return "";
}

export default function EditVehiclePage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDocument<Vehicle>("vehicles", vehicleId);
        if (!data) {
          setNotFound(true);
          return;
        }

        setInitialData({
          vehicleClass: data.vehicleClass ?? "compact",
          maker: data.maker ?? "",
          model: data.model ?? "",
          year: data.year ?? new Date().getFullYear(),
          color: data.color ?? "",
          plateNumber: data.plateNumber ?? "",
          chassisNumber: data.chassisNumber ?? "",
          displacement: data.displacement ?? 1500,
          fuelType: data.fuelType ?? "gasoline",
          transmission: data.transmission ?? "AT",
          capacity: data.capacity ?? 5,
          imageUrl: data.imageUrl ?? "",
          inspectionExpiry: toDateString(data.inspectionExpiry),
          legalInspectionExpiry: toDateString(data.legalInspectionExpiry),
          insuranceExpiry: toDateString(data.insuranceExpiry),
          leaseExpiry: toDateString(data.leaseExpiry),
          leaseCompany: data.leaseCompany ?? "",
          leaseMonthlyFee: data.leaseMonthlyFee ?? 0,
          oilChangeIntervalKm: data.oilChangeIntervalKm ?? 5000,
          lastOilChangeKm: data.lastOilChangeKm ?? 0,
          lastOilChangeDate: toDateString(data.lastOilChangeDate),
          currentMileage: data.currentMileage ?? 0,
          status: data.status ?? "active",
          suspendedReason: data.suspendedReason ?? "",
          isDummy: data.isDummy ?? false,
          webMinRentalDays: data.webMinRentalDays ?? 1,
          standardEquipment: data.standardEquipment ?? [],
          isNonSmoking: data.isNonSmoking ?? true,
          hasStudless: data.hasStudless ?? false,
          parkingCertNumber: data.parkingCertNumber ?? "",
          purchaseDate: toDateString(data.purchaseInfo?.purchaseDate),
          purchasePrice: data.purchaseInfo?.purchasePrice ?? 0,
          purchaseFrom: data.purchaseInfo?.purchaseFrom ?? "",
          insuranceCompany: data.insuranceInfo?.insuranceCompany ?? "",
          policyNumber: data.insuranceInfo?.policyNumber ?? "",
          coverageType: data.insuranceInfo?.coverageType ?? "",
          memo: data.memo ?? "",
        });
      } catch (err) {
        console.error("車両データの取得に失敗:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [vehicleId]);

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
        <h2 className="text-lg font-semibold text-slate-300">車両が見つかりません</h2>
      </div>
    );
  }

  return <VehicleForm vehicleId={vehicleId} initialData={initialData!} />;
}
