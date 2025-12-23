"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/trpc/react";

export default function EmailSettingPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const profileQuery = trpc.user.profile.useQuery();
  const updateEmail = trpc.user.updateEmail.useMutation({
    onSuccess: async (data) => {
      await utils.user.profile.invalidate();
      if (data.email) {
        router.push("/cart");
      }
    },
  });

  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = (email ?? profileQuery.data?.email ?? "").trim();
    if (!trimmed) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    try {
      await updateEmail.mutateAsync({ email: trimmed });
      setEmail(trimmed);
      setSuccessMessage("メールアドレスを更新しました。次の購入手続きに進めます。");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "メールアドレスの更新に失敗しました。";
      setErrorMessage(message);
    }
  };

  const isSubmitting = updateEmail.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">メール設定</h1>
          <p className="text-sm text-gray-600">
            Stripe での決済にはメールアドレスが必要です。購入前にメールを登録してください。
          </p>
          <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            メール未登録です。購入にはメール設定が必要です。
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email ?? profileQuery.data?.email ?? ""}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="example@example.com"
                required
              />
              <p className="text-xs text-gray-500">
                購入完了メールや配送通知の送信に利用します。
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? "保存中..." : "メールアドレスを保存"}
            </button>

            {errorMessage && (
              <p className="text-xs text-red-600" aria-live="polite">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-xs text-green-700" aria-live="polite">
                {successMessage}
              </p>
            )}
          </form>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link href="/cart" className="text-yellow-700 underline underline-offset-4">
            カートに戻る
          </Link>
          <Link href="/profile" className="text-gray-700 underline underline-offset-4">
            プロフィールに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
