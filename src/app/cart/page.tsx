"use client";

import Image from "next/image";
import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { trpc } from "@/trpc/react";

type CartItemWithBook = Prisma.CartItemGetPayload<{
  include: { book: { include: { taxRate: true } } };
}>;

const calcUnitPriceIncTax = (item: CartItemWithBook) => {
  const taxRate = Number(item.book.taxRate?.rate ?? 0);
  const unitTax = Math.round(item.book.priceExTax * taxRate);
  return item.book.priceExTax + unitTax;
};

const useCartList = () => {
  const listQuery = trpc.cart.list.useQuery();
  const utils = trpc.useUtils();

  const updateQuantity = trpc.cart.updateQuantity.useMutation({
    onSuccess: async () => {
      await utils.cart.list.invalidate();
    },
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: async () => {
      await utils.cart.list.invalidate();
    },
  });

  return {
    listQuery,
    updateQuantity,
    removeItem,
  };
};

export default function CartPage() {
  const { listQuery, updateQuantity, removeItem } = useCartList();
  const items = listQuery.data ?? [];

  const subtotal = items.reduce((sum, item) => {
    const unit = calcUnitPriceIncTax(item);
    return sum + unit * item.quantity;
  }, 0);

  const handleChangeQuantity = (item: CartItemWithBook, quantity: number) => {
    if (quantity < 0 || quantity > 99) return;
    updateQuantity.mutate({ bookId: item.bookId, quantity });
  };

  const handleRemove = (item: CartItemWithBook) => {
    removeItem.mutate({ bookId: item.bookId });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">カート</h1>
        <p className="text-sm text-gray-600">購入予定の商品を確認できます。</p>
      </div>

      {listQuery.isLoading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">読み込み中...</div>
      )}

      {!listQuery.isLoading && items.length === 0 && (
        <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700">カートに商品がありません。</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            本を探しに行く
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          <ul className="space-y-3">
            {items.map((item) => {
              const unitPriceIncTax = calcUnitPriceIncTax(item);
              const lineTotal = unitPriceIncTax * item.quantity;

              return (
                <li key={item.id} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="relative h-24 w-20 overflow-hidden rounded bg-gray-100">
                      {item.book.coverImage ? (
                        <Image
                          src={item.book.coverImage}
                          alt={item.book.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/books/${item.bookId}`}
                            className="text-sm font-semibold text-gray-900 hover:underline"
                          >
                            {item.book.title}
                          </Link>
                          <div className="text-xs text-gray-600">数量: {item.quantity}</div>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:text-red-700"
                          onClick={() => handleRemove(item)}
                          disabled={removeItem.isPending}
                        >
                          削除
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1 text-sm text-gray-700">
                          <div>
                            単価: ¥{unitPriceIncTax.toLocaleString()} (税込)
                          </div>
                          <div className={item.book.inStock ? "text-green-600" : "text-red-600"}>
                            {item.book.inStock ? "在庫あり" : "在庫なし"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded border bg-white text-lg font-semibold disabled:opacity-50"
                            onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateQuantity.isPending}
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            className="h-8 w-8 rounded border bg-white text-lg font-semibold disabled:opacity-50"
                            onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                            disabled={item.quantity >= 99 || updateQuantity.isPending}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right text-sm font-semibold text-gray-900">
                        小計: ¥{lineTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">合計</span>
              <span className="text-lg font-bold text-gray-900">¥{subtotal.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">送料・手数料は次のステップで計算されます。</p>
          </div>
        </div>
      )}
    </div>
  );
}
