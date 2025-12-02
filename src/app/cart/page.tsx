"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { trpc } from "@/trpc/react";
import { CheckoutConfirmSheet } from "@/components/CheckoutConfirmSheet";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type CartItemWithBook = RouterOutputs["cart"]["list"][number];
type Address = RouterOutputs["userAddress"]["list"][number];

const calcUnitPriceIncTax = (item: CartItemWithBook) => {
  const taxRate = Number(item.book.taxRate?.rate ?? 0);
  const unitTax = Math.round(item.book.priceExTax * taxRate);
  return item.book.priceExTax + unitTax;
};

const mapAddressToShipping = (address: Address) => ({
  shipName: address.recipientName,
  shipPostalCode: address.postalCode,
  shipPrefecture: address.prefecture,
  shipCity: address.city,
  shipTownName: address.townName,
  shipChome: address.chome ?? undefined,
  shipHouseNumber: address.houseNumber ?? undefined,
  shipBuilding: address.building ?? undefined,
});

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
  const addressesQuery = trpc.userAddress.list.useQuery();
  const addresses = useMemo(
    () => addressesQuery.data ?? [],
    [addressesQuery.data],
  );
  const createOrder = trpc.order.createOrder.useMutation();
  const createSession = trpc.checkout.createSession.useMutation();

  const defaultAddress = useMemo(() => {
    return addresses.find((addr) => addr.isDefault) ?? addresses[0];
  }, [addresses]);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) ??
    defaultAddress ??
    null;

  const isCheckoutProcessing =
    createOrder.isPending || createSession.isPending;

  const subtotal = items.reduce((sum, item) => {
    const unit = calcUnitPriceIncTax(item);
    return sum + unit * item.quantity;
  }, 0);
  const checkoutItemsSummary = items.map((item) => ({
    id: item.id,
    title: item.book.title,
    quantity: item.quantity,
  }));

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      setCheckoutError("カートに商品がありません。");
      return;
    }

    if (addressesQuery.isLoading) {
      setCheckoutError("配送先を読み込み中です。少し待ってから再度お試しください。");
      return;
    }

    if (addresses.length === 0) {
      setCheckoutError("プロフィールから配送先を登録してください。");
      return;
    }

    setCheckoutError(null);
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!selectedAddress) {
      setCheckoutError("配送先を選択してください。");
      return;
    }

    try {
      setCheckoutError(null);
      const order = await createOrder.mutateAsync({
        fromCart: true,
        ...mapAddressToShipping(selectedAddress),
      });

      const session = await createSession.mutateAsync({
        orderId: order.orderId,
      });

      window.location.href = session.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Stripe 決済の開始に失敗しました。";
      setCheckoutError(message);
    }
  };

  const handleChangeQuantity = (item: CartItemWithBook, quantity: number) => {
    if (quantity < 0 || quantity > 99) return;
    updateQuantity.mutate({ bookId: item.bookId, quantity });
  };

  const handleRemove = (item: CartItemWithBook) => {
    removeItem.mutate({ bookId: item.bookId });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-black">カート</h1>
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
                          className="flex h-7 w-7 items-center justify-center rounded-full 
                                    border border-gray-300 bg-white hover:bg-gray-100 transition"
                          onClick={() => handleRemove(item)}
                        >
                          <Trash2 className="h-4 w-4 text-black" strokeWidth={2.1} />
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
                            className="h-8 w-8 rounded border border-gray-400 bg-white text-xl font-bold disabled:opacity-50 
                                      hover:bg-gray-50 transition"
                            onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateQuantity.isPending}
                          >
                            -
                          </button>

                          <span className="text-center text-base font-extrabold text-gray-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            className="h-8 w-8 rounded border border-gray-400 bg-white text-xl font-bold disabled:opacity-50
                                      hover:bg-gray-50 transition"
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">合計</span>
                <span className="text-lg font-bold text-gray-900">
                  ¥{subtotal.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                送料は次のステップで計算されます。
              </p>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    配送先と決済
                  </h3>
                  <p className="text-xs text-gray-500">
                    既定の住所で Stripe Checkout を開始します。
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-yellow-700 underline underline-offset-4"
                >
                  住所を編集
                </Link>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                {addressesQuery.isLoading ? (
                  <p>配送先を読み込み中です…</p>
                ) : addressesQuery.error ? (
                  <p className="text-red-600">
                    配送先の取得に失敗しました：{addressesQuery.error.message}
                  </p>
                ) : defaultAddress ? (
                  <div className="space-y-1">
                    <p className="font-semibold">{defaultAddress.recipientName}</p>
                    <p>〒 {defaultAddress.postalCode}</p>
                    <p>
                      {defaultAddress.prefecture}
                      {defaultAddress.city}
                      {defaultAddress.townName}
                      {defaultAddress.chome ?? ""}
                      {defaultAddress.houseNumber ?? ""}
                    </p>
                    {defaultAddress.building && <p>{defaultAddress.building}</p>}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    配送先が登録されていません。プロフィールページから住所を登録してください。
                  </p>
                )}
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:bg-gray-400"
                onClick={handleCheckoutClick}
                disabled={
                  isCheckoutProcessing ||
                  addressesQuery.isLoading ||
                  Boolean(addressesQuery.error) ||
                  items.length === 0 ||
                  addresses.length === 0
                }
              >
                {isCheckoutProcessing ? "処理中..." : "購入手続きへ"}
              </button>
              {checkoutError && !isConfirmOpen && (
                <p className="mt-2 text-xs text-red-600" aria-live="polite">
                  {checkoutError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <CheckoutConfirmSheet
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCheckoutError(null);
        }}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
        summary={{
          subtotal,
          items: checkoutItemsSummary,
        }}
        isProcessing={isCheckoutProcessing}
        onConfirm={handleConfirmCheckout}
        errorMessage={checkoutError}
      />
    </main>
  );
}
