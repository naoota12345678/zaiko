"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDemo } from "@/lib/DemoContext";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const STORE_NAV: NavItem[] = [
  { href: "/demo/store/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/demo/store/inventory", label: "在庫一覧", icon: "📦" },
  { href: "/demo/store/orders", label: "発注PDF取込", icon: "📄" },
  { href: "/demo/store/other-stores", label: "他店舗在庫確認", icon: "🏪" },
];

const HQ_NAV: NavItem[] = [
  { href: "/demo/hq/summary", label: "全店舗サマリー", icon: "🏢" },
  { href: "/demo/hq/transfers", label: "移動申請一覧", icon: "🔄" },
  { href: "/demo/hq/costs", label: "仕入コスト集計", icon: "💰" },
];

export default function DemoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useDemo();

  const isHQ = user?.role === "hq";
  const navItems = isHQ ? HQ_NAV : STORE_NAV;

  const handleLogout = () => {
    logout();
    router.push("/demo/login");
  };

  const handleSwitch = () => {
    logout();
    router.push("/demo/login");
  };

  return (
    <aside className="w-56 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800">
        <Link href={isHQ ? "/demo/hq/summary" : "/demo/store/dashboard"} className="flex items-center gap-2">
          <span className="text-xl">&#9981;</span>
          <span className="text-sm font-bold text-white tracking-tight">
            GS在庫管理
          </span>
        </Link>
      </div>

      {user && (
        <div className="px-5 py-3 border-b border-slate-800">
          <div className="text-xs text-slate-400">ログイン中</div>
          <div className="text-sm font-semibold text-white mt-0.5">
            {user.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-2 h-2 rounded-full ${isHQ ? "bg-emerald-400" : "bg-blue-400"}`} />
            <span className="text-xs text-slate-500">
              {isHQ ? "本部管理者" : user.storeName}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isHQ
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-blue-600/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-2 border-t border-slate-800">
        <button
          onClick={handleSwitch}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors w-full"
        >
          <span className="text-base">🔀</span>
          {isHQ ? "店舗画面へ切替" : "本部画面へ切替"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors w-full"
        >
          <span className="text-base">🚪</span>
          ログアウト
        </button>
      </div>
    </aside>
  );
}
