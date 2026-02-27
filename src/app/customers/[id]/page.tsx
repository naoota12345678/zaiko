"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocument } from "@/lib/firestore";
import { Customer } from "@/types";
import { Timestamp } from "firebase/firestore";
import CustomerForm from "@/components/customers/CustomerForm";

function toDateString(val: Timestamp | Date | null | undefined): string {
  if (!val) return "";
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return "";
}

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDocument<Customer>("customers", customerId);
        if (!data) {
          setNotFound(true);
          return;
        }

        setInitialData({
          lastName: data.lastName ?? "",
          firstName: data.firstName ?? "",
          lastNameKana: data.lastNameKana ?? "",
          firstNameKana: data.firstNameKana ?? "",
          gender: data.gender ?? "male",
          birthDate: toDateString(data.birthDate),
          postalCode: data.postalCode ?? "",
          prefecture: data.prefecture ?? "",
          city: data.city ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          mobile: data.mobile ?? "",
          email: data.email ?? "",
          licenseNumber: data.licenseNumber ?? "",
          licenseExpiry: toDateString(data.licenseExpiry),
          licenseType: data.licenseType ?? "普通",
          blackLevel: data.blackLevel ?? 0,
          blackReason: data.blackReason ?? "",
          isAppMember: data.isAppMember ?? false,
          appMemberId: data.appMemberId ?? "",
          memo: data.memo ?? "",
        });
      } catch (err) {
        console.error("顧客データの取得に失敗:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customerId]);

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
        <h2 className="text-lg font-semibold text-slate-300">顧客が見つかりません</h2>
      </div>
    );
  }

  return <CustomerForm customerId={customerId} initialData={initialData!} />;
}
