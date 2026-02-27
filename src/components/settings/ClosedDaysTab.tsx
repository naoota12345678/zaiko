"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getByStore, addDocument, removeDocument } from "@/lib/firestore";
import { ClosedDay } from "@/types";
import { Timestamp } from "firebase/firestore";

export default function ClosedDaysTab() {
  const { storeId } = useAuth();
  const [closedDays, setClosedDays] = useState<(ClosedDay & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newDate, setNewDate] = useState("");

  // カレンダー表示用
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    if (!storeId) return;
    loadDays();
  }, [storeId]);

  const loadDays = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getByStore<ClosedDay>("closedDays", storeId);
      setClosedDays(data);
    } catch (err) {
      console.error("休業日の取得に失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  const closedSet = new Set(
    closedDays.map((d) => {
      const dt = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date as unknown as string);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    })
  );

  const toggleDay = async (dateStr: string) => {
    if (!storeId) return;
    setSaving(true); setMessage(null);
    try {
      if (closedSet.has(dateStr)) {
        // 削除
        const target = closedDays.find((d) => {
          const dt = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date as unknown as string);
          const s = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
          return s === dateStr;
        });
        if (target) await removeDocument("closedDays", target.id);
      } else {
        // 追加
        await addDocument("closedDays", {
          storeId,
          date: Timestamp.fromDate(new Date(dateStr)),
          isClosed: true,
        });
      }
      await loadDays();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "更新に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDate = async () => {
    if (!newDate) return;
    await toggleDay(newDate);
    setNewDate("");
  };

  // カレンダー生成
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-slate-400 text-sm">読み込み中...</span></div>;

  return (
    <div className="max-w-2xl">
      {message && <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.type === "success" ? "bg-green-900/50 border border-green-700 text-green-300" : "bg-red-900/50 border border-red-700 text-red-300"}`}>{message.text}</div>}

      <p className="text-slate-400 text-sm mb-4">カレンダーの日付をクリックして休業日を設定/解除できます。</p>

      {/* カレンダーヘッダー */}
      <div className="card">
        <div className="card-header">
          <button onClick={prevMonth} className="btn btn-secondary text-sm py-1 px-3">&lt;</button>
          <h3 className="text-lg font-semibold text-white">{viewYear}年 {viewMonth + 1}月</h3>
          <button onClick={nextMonth} className="btn btn-secondary text-sm py-1 px-3">&gt;</button>
        </div>
        <div className="card-body">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"}`}>
                {d}
              </div>
            ))}
          </div>
          {/* カレンダー本体 */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isClosed = closedSet.has(dateStr);
              const dow = (startDow + i) % 7;
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(dateStr)}
                  disabled={saving}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    isClosed
                      ? "bg-red-600/30 text-red-300 border border-red-600"
                      : dow === 0
                      ? "text-red-400 hover:bg-slate-800"
                      : dow === 6
                      ? "text-blue-400 hover:bg-slate-800"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 休業日リスト */}
      {closedDays.length > 0 && (
        <div className="mt-4">
          <p className="text-slate-400 text-xs mb-2">設定済み休業日 ({closedDays.length}件)</p>
          <div className="flex flex-wrap gap-2">
            {closedDays
              .sort((a, b) => {
                const aT = a.date instanceof Timestamp ? a.date.toMillis() : 0;
                const bT = b.date instanceof Timestamp ? b.date.toMillis() : 0;
                return aT - bT;
              })
              .map((d) => {
                const dt = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date as unknown as string);
                return (
                  <span key={d.id} className="px-2 py-1 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs">
                    {dt.getMonth() + 1}/{dt.getDate()}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
