"use client";

import Link from "next/link";

import { trpc } from "@/trpc/react";

export default function CartPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, isFetching } = trpc.cart.list.useQuery();

  const updateMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });

  const cartItems = data ?? [];
  const subtotalExTax = cartItems.reduce(
    (sum, item) => sum + item.book.priceExTax * item.quantity,
    0,
  );
  const taxTotal = cartItems.reduce(
    (sum, item) => sum + item.unitTax * item.quantity,
    0,
  );
  const totalAmount = subtotalExTax + taxTotal;

  const handleChangeQuantity = (id: string, nextQuantity: number) => {
    if (nextQuantity < 1 || updateMutation.isPending) return;
    updateMutation.mutate({ id, quantity: nextQuantity });
  };

  const handleRemove = (id: string) => {
    if (removeMutation.isPending) return;
    removeMutation.mutate({ id });
  };

  return (
    <main className="bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">カート</h1>
            <p className="text-sm text-gray-600">
              お気に入りの本を確認して購入手続きへ進みましょう。
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 underline underline-offset-2"
          >
            ← 本を探す
          </Link>
        </header>

        {isLoading ? (
          <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-32 animate-pulse rounded bg-gray-100" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-600">カートは空です。</p>
            <Link
              href="/"
              className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              本を探しに行く
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3">
              {cartItems.map((item) => {
                const priceIncTax = item.unitPriceIncTax * item.quantity;

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.book.title}
                      </div>
                      <div className="text-xs text-gray-600">{item.book.author}</div>
                      <div className="text-xs text-gray-500">税込 ¥{priceIncTax.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <div className="flex items-center rounded border bg-gray-50">
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1 || isFetching}
                          className="px-3 py-1 text-lg text-gray-600 disabled:text-gray-300"
                        >
                          −
                        </button>
                        <span className="min-w-[40px] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeQuantity(item.id, item.quantity + 1)
                          }
                          disabled={isFetching}
                          className="px-3 py-1 text-lg text-gray-600 disabled:text-gray-300"
                        >
                          ＋
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={isFetching}
                        className="text-sm font-semibold text-red-600 underline underline-offset-2 disabled:text-red-300"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">注文概要</h2>
              <dl className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <dt>小計 (税抜)</dt>
                  <dd>¥{subtotalExTax.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>消費税</dt>
                  <dd>¥{taxTotal.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <dt>合計 (税込)</dt>
                  <dd>¥{totalAmount.toLocaleString()}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center rounded bg-yellow-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-yellow-500"
              >
                レジに進む
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
