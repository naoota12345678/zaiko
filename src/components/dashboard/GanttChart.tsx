"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  Vehicle,
  VehicleClass,
  VEHICLE_CLASS_LABELS,
  Reservation,
  Rental,
} from "@/types";

// ============================================================
// Types
// ============================================================

export type BarType = "approved" | "pending" | "rental" | "overdue";

export interface GanttBar {
  id: string;
  type: BarType;
  vehicleId: string;
  customerName: string;
  startDate: Date;
  endDate: Date;
  linkHref: string;
}

interface GanttChartProps {
  vehicles: (Vehicle & { id: string })[];
  bars: GanttBar[];
  startDate: Date;
  totalDays: number;
  selectedClass: VehicleClass | "all";
}

// ============================================================
// Helpers
// ============================================================

const BAR_COLORS: Record<BarType, string> = {
  approved: "bg-blue-500 hover:bg-blue-400",
  pending: "bg-amber-500 hover:bg-amber-400",
  rental: "bg-green-500 hover:bg-green-400",
  overdue: "bg-red-500 hover:bg-red-400",
};

const BAR_LABELS: Record<BarType, string> = {
  approved: "承認済",
  pending: "未承認",
  rental: "貸出中",
  overdue: "返却超過",
};

function toDateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDayOfWeekShort(d: Date): string {
  return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

// ============================================================
// Component
// ============================================================

export default function GanttChart({
  vehicles,
  bars,
  startDate,
  totalDays,
  selectedClass,
}: GanttChartProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    bar: GanttBar;
    x: number;
    y: number;
  } | null>(null);

  const today = new Date();
  const periodStart = toDateOnly(startDate);
  const periodMs = totalDays * 86400000;

  // Generate date columns
  const dates: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  // Filter vehicles by class
  const filtered =
    selectedClass === "all"
      ? vehicles
      : vehicles.filter((v) => v.vehicleClass === selectedClass);

  // Group by vehicle class
  const grouped = new Map<VehicleClass, (Vehicle & { id: string })[]>();
  for (const v of filtered) {
    const list = grouped.get(v.vehicleClass) || [];
    list.push(v);
    grouped.set(v.vehicleClass, list);
  }

  // Sort class keys in a consistent order
  const classOrder: VehicleClass[] = [
    "kei", "compact", "sedan", "suv", "minivan", "wagon", "van", "truck",
  ];
  const sortedClasses = classOrder.filter((c) => grouped.has(c));

  // Calculate bar position
  function calcBar(bar: GanttBar) {
    const barStart = toDateOnly(bar.startDate);
    const barEnd = toDateOnly(bar.endDate) + 86400000; // end date is inclusive
    const clampStart = Math.max(barStart, periodStart);
    const clampEnd = Math.min(barEnd, periodStart + periodMs);
    if (clampStart >= clampEnd) return null;

    const leftPct = ((clampStart - periodStart) / periodMs) * 100;
    const widthPct = ((clampEnd - clampStart) / periodMs) * 100;
    return { leftPct, widthPct };
  }

  function handleBarClick(bar: GanttBar) {
    router.push(bar.linkHref);
  }

  function handleBarHover(
    e: React.MouseEvent,
    bar: GanttBar
  ) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      bar,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }

  if (filtered.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">表示する車両がありません</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden relative">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Date header */}
          <div className="flex border-b border-slate-800 sticky top-0 z-20 bg-slate-900">
            <div className="w-[180px] min-w-[180px] px-3 py-2 text-xs text-slate-500 font-medium border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
              車両
            </div>
            <div className="flex-1 flex">
              {dates.map((d, i) => {
                const isToday = isSameDay(d, today);
                const weekend = isWeekend(d);
                return (
                  <div
                    key={i}
                    className={`flex-1 text-center py-1.5 border-r border-slate-800/50 ${
                      isToday
                        ? "bg-blue-900/30"
                        : weekend
                        ? "bg-slate-800/30"
                        : ""
                    }`}
                  >
                    <div className={`text-xs font-medium ${isToday ? "text-blue-300" : "text-slate-400"}`}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                    <div
                      className={`text-[10px] ${
                        isToday
                          ? "text-blue-400"
                          : d.getDay() === 0
                          ? "text-red-400"
                          : d.getDay() === 6
                          ? "text-blue-400"
                          : "text-slate-500"
                      }`}
                    >
                      {getDayOfWeekShort(d)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          {sortedClasses.map((cls) => {
            const classVehicles = grouped.get(cls)!;
            return (
              <div key={cls}>
                {/* Class separator */}
                <div className="flex border-b border-slate-800 bg-slate-800/40">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-300 sticky left-0 bg-slate-800/40">
                    {VEHICLE_CLASS_LABELS[cls]}
                    <span className="ml-2 text-slate-500">
                      ({classVehicles.length}台)
                    </span>
                  </div>
                </div>

                {/* Vehicle rows */}
                {classVehicles.map((vehicle) => {
                  const vehicleBars = bars.filter(
                    (b) => b.vehicleId === vehicle.id
                  );
                  return (
                    <div
                      key={vehicle.id}
                      className="flex border-b border-slate-800/50 hover:bg-slate-800/20 group"
                    >
                      {/* Vehicle label */}
                      <div className="w-[180px] min-w-[180px] px-3 py-2 border-r border-slate-800 sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800/60 transition-colors">
                        <div className="text-xs font-medium text-slate-200 truncate">
                          {vehicle.plateNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {vehicle.maker} {vehicle.model}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 relative" style={{ height: "44px" }}>
                        {/* Column background */}
                        <div className="absolute inset-0 flex">
                          {dates.map((d, i) => {
                            const isToday = isSameDay(d, today);
                            const weekend = isWeekend(d);
                            return (
                              <div
                                key={i}
                                className={`flex-1 border-r border-slate-800/30 ${
                                  isToday
                                    ? "bg-blue-900/15"
                                    : weekend
                                    ? "bg-slate-800/15"
                                    : ""
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Today indicator line */}
                        {dates.some((d) => isSameDay(d, today)) && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-blue-500/50 z-10"
                            style={{
                              left: `${
                                ((toDateOnly(today) - periodStart) / periodMs) *
                                100
                              }%`,
                            }}
                          />
                        )}

                        {/* Bars */}
                        {vehicleBars.map((bar) => {
                          const pos = calcBar(bar);
                          if (!pos) return null;
                          return (
                            <div
                              key={bar.id}
                              className={`absolute top-[8px] h-[28px] rounded-md cursor-pointer transition-colors z-10 flex items-center px-1.5 ${BAR_COLORS[bar.type]}`}
                              style={{
                                left: `${pos.leftPct}%`,
                                width: `${pos.widthPct}%`,
                                minWidth: "4px",
                              }}
                              onClick={() => handleBarClick(bar)}
                              onMouseEnter={(e) => handleBarHover(e, bar)}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              {pos.widthPct > 6 && (
                                <span className="text-[10px] text-white font-medium truncate">
                                  {bar.customerName}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-xs font-medium text-white">
            {tooltip.bar.customerName}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {tooltip.bar.startDate.getMonth() + 1}/
            {tooltip.bar.startDate.getDate()} ～{" "}
            {tooltip.bar.endDate.getMonth() + 1}/
            {tooltip.bar.endDate.getDate()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {BAR_LABELS[tooltip.bar.type]}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Utility: Build bars from reservations and rentals
// ============================================================

export function buildBars(
  reservations: (Reservation & { id: string })[],
  rentals: (Rental & { id: string })[]
): GanttBar[] {
  const bars: GanttBar[] = [];

  for (const r of reservations) {
    const start = r.startDate instanceof Timestamp
      ? r.startDate.toDate()
      : new Date(r.startDate);
    const end = r.endDate instanceof Timestamp
      ? r.endDate.toDate()
      : new Date(r.endDate);

    bars.push({
      id: `res-${r.id}`,
      type: r.status === "approved" ? "approved" : "pending",
      vehicleId: r.vehicleId,
      customerName: r.customerName,
      startDate: start,
      endDate: end,
      linkHref: `/reservations/${r.id}/edit`,
    });
  }

  for (const r of rentals) {
    const start = r.startDate instanceof Timestamp
      ? r.startDate.toDate()
      : new Date(r.startDate);
    const end = r.endDate instanceof Timestamp
      ? r.endDate.toDate()
      : new Date(r.endDate);
    const isOverdue =
      r.status === "overdue" || r.status === "unreturned";

    bars.push({
      id: `ren-${r.id}`,
      type: isOverdue ? "overdue" : "rental",
      vehicleId: r.vehicleId,
      customerName: r.customerName,
      startDate: start,
      endDate: end,
      linkHref: `/rentals/${r.id}`,
    });
  }

  return bars;
}
