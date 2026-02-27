"use client";

import { VehicleClass, VEHICLE_CLASS_LABELS } from "@/types";

interface GanttToolbarProps {
  startDate: Date;
  onPrevWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
  selectedClass: VehicleClass | "all";
  onClassChange: (cls: VehicleClass | "all") => void;
  availableClasses: VehicleClass[];
}

const BAR_LEGEND = [
  { label: "承認済", color: "bg-blue-500" },
  { label: "未承認", color: "bg-amber-500" },
  { label: "貸出中", color: "bg-green-500" },
  { label: "返却超過", color: "bg-red-500" },
];

function formatDateRange(start: Date, days: number): string {
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;
  return `${start.getFullYear()}年 ${fmt(start)} ～ ${fmt(end)}`;
}

export default function GanttToolbar({
  startDate,
  onPrevWeek,
  onToday,
  onNextWeek,
  selectedClass,
  onClassChange,
  availableClasses,
}: GanttToolbarProps) {
  return (
    <div className="card">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <button onClick={onPrevWeek} className="btn btn-ghost px-2 py-1 text-xs">
            ◀ 前週
          </button>
          <button onClick={onToday} className="btn btn-secondary px-3 py-1 text-xs">
            今日
          </button>
          <button onClick={onNextWeek} className="btn btn-ghost px-2 py-1 text-xs">
            次週 ▶
          </button>
        </div>

        {/* Date range display */}
        <span className="text-sm text-slate-300 font-medium">
          {formatDateRange(startDate, 14)}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Class filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => onClassChange("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedClass === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            すべて
          </button>
          {availableClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => onClassChange(cls)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedClass === cls
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {VEHICLE_CLASS_LABELS[cls]}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4">
        {BAR_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
