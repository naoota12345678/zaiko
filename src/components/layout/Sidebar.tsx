"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { signOut } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "稼働表", icon: "📊" },
  { href: "/reservations", label: "予約管理", icon: "📋" },
  { href: "/rentals", label: "貸出管理", icon: "📝" },
  { href: "/vehicles", label: "車両管理", icon: "🚗" },
  { href: "/customers", label: "顧客管理", icon: "👥" },
  { href: "/sales", label: "売上管理", icon: "💰", adminOnly: true },
  { href: "/settings", label: "店舗設定", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useAuth();

  const role = userData?.role ?? "staff";
  const isAdmin = canAccessAdmin(role);

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-56 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* ロゴ */}
      <div className="px-5 py-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🚗</span>
          <span className="text-sm font-bold text-white tracking-tight">
            レンタカー管理
          </span>
        </Link>
      </div>

      {/* ユーザー情報 */}
      {userData && (
        <div className="px-5 py-3 border-b border-slate-800">
          <div className="text-xs text-slate-400">ログイン中</div>
          <div className="text-sm font-semibold text-white mt-0.5">
            {userData.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                role === "owner"
                  ? "bg-amber-400"
                  : role === "manager"
                  ? "bg-blue-400"
                  : "bg-slate-400"
              }`}
            />
            <span className="text-xs text-slate-500">
              {role === "owner" ? "オーナー" : role === "manager" ? "店長" : "スタッフ"}
            </span>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
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

      {/* ログアウト */}
      <div className="px-3 py-4 border-t border-slate-800">
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
