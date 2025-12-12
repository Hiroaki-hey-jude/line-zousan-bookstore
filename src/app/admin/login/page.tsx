"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { setAdminSession } from "../actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin/shipments";

  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await setAdminSession(token.trim());
      if (!result.success) {
        setError(result.error ?? "ログインに失敗しました。");
        return;
      }

      router.push(redirectTo);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg space-y-4 p-4 sm:p-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">管理ログイン</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理用アクセストークンを入力してください。環境変数 ADMIN_ACCESS_TOKEN を
            設定している場合は同じ値を使います。指定がない場合は「letmein」がデフォルトです。
            ログイン後はトークンそのものではなく、httpOnly + 署名付きの管理セッション
            Cookie が暗号化されて保存されます。
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              アクセストークン
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                placeholder="管理用トークンを入力"
                required
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-amber-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {isPending ? "確認中…" : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
