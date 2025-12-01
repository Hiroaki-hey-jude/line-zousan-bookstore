"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { trpc } from "@/trpc/react";

const formatPrice = (value: number) => `¥${value.toLocaleString()}`;

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const orderQuery = trpc.order.byStripeSession.useQuery(
    { sessionId: sessionId ?? "" },
    { enabled: Boolean(sessionId) },
  );

  const clearCart = trpc.cart.clear.useMutation();

  useEffect(() => {
    if (orderQuery.data && !clearCart.isPending && clearCart.isIdle) {
      clearCart.mutate();
    }
  }, [clearCart, orderQuery.data]);

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">セッションが見つかりません</h1>
        <p className="text-sm text-gray-700">
          正しいリンクからアクセスしてください。
        </p>
        <Link
          href="/cart"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          カートに戻る
        </Link>
      </main>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">決済を確認中...</h1>
        <p className="text-sm text-gray-700">少々お待ちください。</p>
      </main>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">注文を確認できませんでした</h1>
        <p className="text-sm text-red-700">{orderQuery.error?.message ?? "不明なエラーが発生しました。"}</p>
        <Link
          href="/"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          トップに戻る
        </Link>
      </main>
    );
  }

  const order = orderQuery.data;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">購入ありがとうございました</h1>
        <p className="mt-2 text-sm text-gray-700">
          ご注文ID: <span className="font-mono">{order.id}</span>
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">注文内容</h2>
        {order.items.length === 0 ? (
          <p className="mt-3 text-sm text-gray-700">
            決済が完了次第、商品情報が表示されます。
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.book.title}</p>
                  <p className="text-xs text-gray-600">数量: {item.quantity}</p>
                </div>
                <div className="text-right text-sm text-gray-900">
                  <p>{formatPrice(item.unitPriceIncTax)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-2 text-sm text-gray-900">
          <div className="flex items-center justify-between">
            <span>商品合計 (税抜)</span>
            <span>{formatPrice(order.subtotalExTax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>消費税</span>
            <span>{formatPrice(order.taxTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>送料</span>
            <span>{formatPrice(order.shippingFeeExTax + order.shippingTax)}</span>
          </div>
          <div className="flex items-center justify-between font-bold">
            <span>合計</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          注文履歴を確認する
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
