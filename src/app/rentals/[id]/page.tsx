"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocument } from "@/lib/firestore";
import { Rental } from "@/types";
import RentalDetailView from "@/components/rentals/RentalDetailView";

export default function RentalDetailPage() {
  const params = useParams();
  const rentalId = params.id as string;
  const [rental, setRental] = useState<(Rental & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDocument<Rental>("rentals", rentalId);
        if (!data) { setNotFound(true); return; }
        setRental(data);
      } catch (err) {
        console.error("貸出データの取得に失敗:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [rentalId]);

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

  if (notFound || !rental) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold text-slate-300">貸出データが見つかりません</h2>
      </div>
    );
  }

  return <RentalDetailView rental={rental} />;
}
