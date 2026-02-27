"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getByStore } from "@/lib/firestore";
import { Customer, BLACK_LEVEL_LABELS, BlackLevel } from "@/types";

export default function CustomersPage() {
  const { storeId } = useAuth();
  const [customers, setCustomers] = useState<(Customer & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!storeId) return;

    const load = async () => {
      try {
        const data = await getByStore<Customer>("customers", storeId);
        setCustomers(data);
      } catch (err) {
        console.error("顧客データの取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storeId]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.lastName}${c.firstName}`.includes(q) ||
      `${c.lastNameKana}${c.firstNameKana}`.includes(q) ||
      c.phone?.includes(q) ||
      c.mobile?.includes(q) ||
      c.licenseNumber?.includes(q)
    );
  });

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

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">顧客管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            登録顧客 {customers.length} 件
          </p>
        </div>
        <Link href="/customers/new" className="btn btn-primary">
          + 新規登録
        </Link>
      </div>

      {/* 検索 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input max-w-md"
          placeholder="氏名・カナ・電話番号・免許証番号で検索..."
        />
      </div>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            {search ? "該当する顧客が見つかりません" : "顧客が登録されていません"}
          </h2>
          {!search && (
            <>
              <p className="text-slate-500 text-sm mb-4">
                「新規登録」から顧客を追加してください。
              </p>
              <Link href="/customers/new" className="btn btn-primary">
                + 新規登録
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>フリガナ</th>
                <th>電話番号</th>
                <th>免許証番号</th>
                <th>利用回数</th>
                <th>ステータス</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-white">
                    {c.lastName} {c.firstName}
                    {c.isAppMember && (
                      <span className="ml-2 badge badge-blue">会員</span>
                    )}
                  </td>
                  <td className="text-slate-400">
                    {c.lastNameKana} {c.firstNameKana}
                  </td>
                  <td className="text-slate-400">
                    {c.mobile || c.phone || "-"}
                  </td>
                  <td className="font-mono text-slate-400">
                    {c.licenseNumber || "-"}
                  </td>
                  <td className="text-slate-400">
                    {c.totalRentals ?? 0} 回
                  </td>
                  <td>
                    {(c.blackLevel ?? 0) > 0 ? (
                      <span className={`badge ${
                        c.blackLevel === 3 ? "badge-red" :
                        c.blackLevel === 2 ? "badge-amber" : "badge-gray"
                      }`}>
                        {BLACK_LEVEL_LABELS[c.blackLevel as BlackLevel]}
                      </span>
                    ) : (
                      <span className="badge badge-green">通常</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
