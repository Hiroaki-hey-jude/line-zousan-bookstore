"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/server/api/root";
import { trpc } from "@/trpc/react";
import { CheckoutConfirmSheet } from "@/components/CheckoutConfirmSheet";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Address = RouterOutputs["userAddress"]["list"][number];

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

type BuyNowButtonProps = {
  bookId: string;
  bookTitle: string;
  unitPriceIncTax: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
};

export function BuyNowButton({
  bookId,
  bookTitle,
  unitPriceIncTax,
  quantity = 1,
  disabled,
  className,
  children,
}: BuyNowButtonProps) {
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    defaultAddress ??
    null;

  const isProcessing = createOrder.isPending || createSession.isPending;

  const handleClick = () => {
    if (disabled || isProcessing) return;

    if (addressesQuery.isLoading) {
      setErrorMessage("配送先を読み込み中です。少し待ってから再度お試しください。");
      return;
    }

    if (addresses.length === 0) {
      setErrorMessage("プロフィールから配送先を登録してください。");
      return;
    }

    setErrorMessage(null);
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedAddress) {
      setErrorMessage("配送先を選択してください。");
      return;
    }

    try {
      setErrorMessage(null);
      const order = await createOrder.mutateAsync({
        fromCart: false,
        bookId,
        quantity,
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
          : "決済フローの開始に失敗しました。";
      setErrorMessage(message);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={
          disabled ||
          isProcessing ||
          addressesQuery.isLoading ||
          Boolean(addressesQuery.error)
        }
        onClick={handleClick}
      >
        {isProcessing ? "処理中..." : children ?? "⚡ 今すぐ買う"}
      </button>
      {errorMessage && !isConfirmOpen && (
        <p className="text-xs text-red-600" aria-live="polite">
          {errorMessage}
        </p>
      )}
      {!defaultAddress && !addressesQuery.isLoading && !errorMessage && (
        <p className="text-xs text-gray-500">
          既定の配送先をプロフィールで設定してください。
        </p>
      )}

      <CheckoutConfirmSheet
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setErrorMessage(null);
        }}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
        summary={{
          subtotal: unitPriceIncTax * quantity,
          items: [
            {
              id: bookId,
              title: bookTitle,
              quantity,
            },
          ],
        }}
        isProcessing={isProcessing}
        onConfirm={handleConfirm}
        errorMessage={errorMessage}
        confirmLabel="購入手続きを続行"
      />
    </div>
  );
}
