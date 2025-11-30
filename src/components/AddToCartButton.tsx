"use client";

import { ComponentProps } from "react";

import { trpc } from "@/trpc/react";

type AddToCartButtonProps = {
  bookId: string;
  disabled?: boolean;
} & ComponentProps<"button">;

export function AddToCartButton({
  bookId,
  disabled,
  className,
  children,
  ...rest
}: AddToCartButtonProps) {
  const utils = trpc.useUtils();
  const addMutation = trpc.cart.add.useMutation({
    onSuccess: async () => {
      await utils.cart.list.invalidate();
    },
  });

  const isBusy = addMutation.isPending;

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || isBusy}
      onClick={() => addMutation.mutate({ bookId, quantity: 1 })}
      {...rest}
    >
      {isBusy ? "追加中..." : children ?? "🛒 カートに入れる"}
    </button>
  );
}
