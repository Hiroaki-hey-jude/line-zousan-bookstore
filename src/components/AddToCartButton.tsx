"use client";

import { useState } from "react";

import { trpc } from "@/trpc/react";

type Props = {
  bookId: string;
  disabled?: boolean;
  className?: string;
};

export function AddToCartButton({ bookId, disabled, className }: Props) {
  const utils = trpc.useUtils();
  const [isAdded, setIsAdded] = useState(false);

  const addMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      setIsAdded(true);
      utils.cart.list.invalidate();
      setTimeout(() => setIsAdded(false), 1500);
    },
  });

  const handleAdd = () => {
    setIsAdded(false);
    addMutation.mutate({ bookId, quantity: 1 });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled || addMutation.isPending}
      className={className}
    >
      {isAdded ? "✅ 追加しました" : "🛒 カートに入れる"}
    </button>
  );
}
