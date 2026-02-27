"use client";

import { useEffect, useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import {
  Vehicle,
  VehicleClass,
  Reservation,
  Rental,
} from "@/types";
import SummaryCards from "@/components/dashboard/SummaryCards";
import GanttToolbar from "@/components/dashboard/GanttToolbar";
import GanttChart, { buildBars, GanttBar } from "@/components/dashboard/GanttChart";

// ============================================================
// Helpers
// ============================================================

const TOTAL_DAYS = 14;
const DAYS_BEFORE_TODAY = 3;

function getDefaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - DAYS_BEFORE_TODAY);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDate(ts: Timestamp | Date | string): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  return new Date(ts);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// Page Component
// ============================================================

export default function DashboardPage() {
  const { storeId } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data
  const [vehicles, setVehicles] = useState<(Vehicle & { id: string })[]>([]);
  const [reservations, setReservations] = useState<(Reservation & { id: string })[]>([]);
  const [rentals, setRentals] = useState<(Rental & { id: string })[]>([]);

  // UI state
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [selectedClass, setSelectedClass] = useState<VehicleClass | "all">("all");

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [vehicleData, reservationData, rentalData] = await Promise.all([
        getByStore<Vehicle>("vehicles", storeId),
        getByStore<Reservation>("reservations", storeId),
        getByStore<Rental>("rentals", storeId),
      ]);

      // Active vehicles only
      const activeVehicles = vehicleData
        .filter((v) => v.status === "active")
        .sort((a, b) => {
          if (a.vehicleClass !== b.vehicleClass)
            return a.vehicleClass.localeCompare(b.vehicleClass);
          return a.plateNumber.localeCompare(b.plateNumber);
        });

      // Reservations: only approved/pending_approval (not cancelled/rejected/converted)
      const activeReservations = reservationData.filter(
        (r) => r.status === "approved" || r.status === "pending_approval"
      );

      // Rentals: only active/extended/overdue/unreturned
      const activeRentals = rentalData.filter(
        (r) =>
          r.status === "active" ||
          r.status === "extended" ||
          r.status === "overdue" ||
          r.status === "unreturned"
      );

      setVehicles(activeVehicles);
      setReservations(activeReservations);
      setRentals(activeRentals);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Computed values
  // ============================================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Summary card counts
  const todayDepartures = reservations.filter((r) => {
    const start = toDate(r.startDate);
    return isSameDay(start, today) && r.status === "approved";
  }).length;

  const todayReturns = [
    ...reservations.filter((r) => {
      const end = toDate(r.endDate);
      return isSameDay(end, today) && r.status === "approved";
    }),
    ...rentals.filter((r) => {
      const end = toDate(r.endDate);
      return isSameDay(end, today);
    }),
  ].length;

  const pendingApprovals = reservations.filter(
    (r) => r.status === "pending_approval"
  ).length;

  const overdueRentals = rentals.filter(
    (r) => r.status === "overdue" || r.status === "unreturned"
  ).length;

  // Available classes from active vehicles
  const availableClasses = [
    ...new Set(vehicles.map((v) => v.vehicleClass)),
  ].sort() as VehicleClass[];

  // Build bars for Gantt chart
  const bars: GanttBar[] = buildBars(reservations, rentals);

  // ============================================================
  // Navigation handlers
  // ============================================================

  function handlePrevWeek() {
    setStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function handleToday() {
    setStartDate(getDefaultStartDate());
  }

  function handleNextWeek() {
    setStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">稼働表</h1>
          <p className="text-slate-400 text-sm mt-1">
            車両の予約・貸出状況を確認できます
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">稼働表</h1>
        <p className="text-slate-400 text-sm mt-1">
          車両の予約・貸出状況を確認できます
        </p>
      </div>

      {/* Summary cards */}
      <SummaryCards
        todayDepartures={todayDepartures}
        todayReturns={todayReturns}
        pendingApprovals={pendingApprovals}
        overdueRentals={overdueRentals}
      />

      {/* Toolbar */}
      <GanttToolbar
        startDate={startDate}
        onPrevWeek={handlePrevWeek}
        onToday={handleToday}
        onNextWeek={handleNextWeek}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        availableClasses={availableClasses}
      />

      {/* Gantt chart */}
      <GanttChart
        vehicles={vehicles}
        bars={bars}
        startDate={startDate}
        totalDays={TOTAL_DAYS}
        selectedClass={selectedClass}
      />
    </div>
  );
}
