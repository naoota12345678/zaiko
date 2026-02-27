"use client";

import Link from "next/link";

interface SummaryCardsProps {
  todayDepartures: number;
  todayReturns: number;
  pendingApprovals: number;
  overdueRentals: number;
}

const cards = [
  {
    key: "departures",
    label: "本日出発",
    icon: "🚗",
    color: "text-green-400",
    borderColor: "border-green-800/50",
    href: null,
  },
  {
    key: "returns",
    label: "本日返却",
    icon: "🔄",
    color: "text-blue-400",
    borderColor: "border-blue-800/50",
    href: null,
  },
  {
    key: "pending",
    label: "未承認予約",
    icon: "⏳",
    color: "text-amber-400",
    borderColor: "border-amber-800/50",
    href: "/reservations",
  },
  {
    key: "overdue",
    label: "返却超過",
    icon: "⚠️",
    color: "text-red-400",
    borderColor: "border-red-800/50",
    href: null,
  },
] as const;

export default function SummaryCards({
  todayDepartures,
  todayReturns,
  pendingApprovals,
  overdueRentals,
}: SummaryCardsProps) {
  const values: Record<string, number> = {
    departures: todayDepartures,
    returns: todayReturns,
    pending: pendingApprovals,
    overdue: overdueRentals,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const inner = (
          <div
            className={`bg-slate-900 border border-slate-800 ${card.borderColor} rounded-xl p-4 transition-colors ${
              card.href ? "hover:bg-slate-800/50 cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">{card.label}</div>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${card.color}`}>
              {values[card.key]}
            </div>
          </div>
        );

        if (card.href) {
          return (
            <Link key={card.key} href={card.href}>
              {inner}
            </Link>
          );
        }
        return <div key={card.key}>{inner}</div>;
      })}
    </div>
  );
}
