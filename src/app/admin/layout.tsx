import Link from "next/link";
import type { ReactNode } from "react";

import { clearAdminSession } from "./actions";
import { AdminTRPCProvider } from "../trpc-provider";

export const metadata = {
  title: "Admin | ZouSan Bookstore",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminTRPCProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <header className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Admin</p>
              <h1 className="text-2xl font-bold text-gray-900">ZouSan Bookstore 管理</h1>
              <p className="text-sm text-gray-600">注文と配送の管理ツールです。</p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-gray-700">
              <Link
                href="/admin/shipments"
                className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                配送管理
              </Link>
              <form action={clearAdminSession}>
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  ログアウト
                </button>
              </form>
            </nav>
          </header>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            {children}
          </section>
        </div>
      </div>
    </AdminTRPCProvider>
  );
}
