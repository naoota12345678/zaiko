"use client";

import { useState } from "react";
import StoreSettingsTab from "@/components/settings/StoreSettingsTab";
import PricingPlansTab from "@/components/settings/PricingPlansTab";
import OptionMasterTab from "@/components/settings/OptionMasterTab";
import CancelPolicyTab from "@/components/settings/CancelPolicyTab";
import MaintenanceShopTab from "@/components/settings/MaintenanceShopTab";
import ClosedDaysTab from "@/components/settings/ClosedDaysTab";
import NetReservationTab from "@/components/settings/NetReservationTab";

const TABS = [
  { key: "store", label: "店舗情報" },
  { key: "pricing", label: "料金プラン" },
  { key: "options", label: "オプション" },
  { key: "cancel", label: "キャンセルポリシー" },
  { key: "shops", label: "整備工場" },
  { key: "closed", label: "休業日" },
  { key: "net", label: "ネット予約" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("store");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">設定</h1>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === "store" && <StoreSettingsTab />}
      {activeTab === "pricing" && <PricingPlansTab />}
      {activeTab === "options" && <OptionMasterTab />}
      {activeTab === "cancel" && <CancelPolicyTab />}
      {activeTab === "shops" && <MaintenanceShopTab />}
      {activeTab === "closed" && <ClosedDaysTab />}
      {activeTab === "net" && <NetReservationTab />}
    </div>
  );
}
