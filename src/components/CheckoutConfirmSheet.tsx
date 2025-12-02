"use client";

import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Address = RouterOutputs["userAddress"]["list"][number];

export type CheckoutSummaryItem = {
  id: string;
  title: string;
  quantity: number;
};

type CheckoutConfirmSheetProps = {
  open: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
  summary: {
    subtotal: number;
    items: CheckoutSummaryItem[];
  };
  isProcessing: boolean;
  onConfirm: () => void;
  errorMessage?: string | null;
  confirmLabel?: string;
};

export function CheckoutConfirmSheet({
  open,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  summary,
  isProcessing,
  onConfirm,
  errorMessage,
  confirmLabel = "この内容で Stripe へ進む",
}: CheckoutConfirmSheetProps) {
  if (!open) return null;

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isProcessing) {
            onClose();
          }
        }}
      />
      <div className="relative w-full max-w-2xl rounded-t-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Stripe 決済前に配送先を確認してください
            </p>
            <p className="text-xs text-gray-500">
              下記から配送先を選択・変更できます。住所の追加や編集はプロフィールページで行えます。
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900"
            onClick={() => {
              if (!isProcessing) {
                onClose();
              }
            }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                配送先を選択
              </h3>
              <Link
                href="/profile"
                className="text-xs font-semibold text-yellow-700 underline underline-offset-4"
              >
                住所を管理
              </Link>
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  住所が登録されていません。プロフィールページで追加してください。
                </p>
              ) : (
                addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition ${
                      selectedAddress?.id === address.id
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      className="mt-1 h-4 w-4 accent-yellow-500"
                      value={address.id}
                      checked={selectedAddress?.id === address.id}
                      onChange={() => onSelectAddress(address.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {address.label ?? "配送先"}
                        </p>
                        {address.isDefault && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            既定
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {address.recipientName} / {address.phone}
                      </p>
                      <div className="mt-1 text-xs text-gray-600">
                        <p>〒 {address.postalCode}</p>
                        <p>
                          {address.prefecture}
                          {address.city}
                          {address.townName}
                          {address.chome ?? ""}
                          {address.houseNumber ?? ""}
                          {address.building ? ` ${address.building}` : ""}
                        </p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <div className="flex items-center justify-between text-gray-900">
              <p className="text-sm font-semibold">お支払い予定金額</p>
              <p className="text-xl font-bold">
                ¥{summary.subtotal.toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              税込・送料別。Stripe 上で最終決済を完了します。
            </p>
            <ul className="mt-3 max-h-28 space-y-2 overflow-y-auto rounded-xl bg-white/70 p-3">
              {summary.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span className="flex-1 text-gray-600">{item.title}</span>
                  <span className="font-semibold text-gray-900">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:bg-gray-400"
            onClick={onConfirm}
            disabled={
              isProcessing || !selectedAddress || addresses.length === 0
            }
          >
            {isProcessing ? "処理中..." : confirmLabel}
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            onClick={() => {
              if (!isProcessing) {
                onClose();
              }
            }}
            disabled={isProcessing}
          >
            キャンセル
          </button>
          {errorMessage && (
            <p className="text-xs text-red-600" aria-live="polite">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
