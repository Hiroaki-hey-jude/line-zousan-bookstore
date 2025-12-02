"use client";

import {
  ComponentProps,
  useEffect,
  useRef,
  useState,
} from "react";

import { trpc } from "@/trpc/react";

type AddToCartButtonProps = {
  bookId: string;
  disabled?: boolean;
} & ComponentProps<"button">;

const FEEDBACK_DURATION = 1600;

export function AddToCartButton({
  bookId,
  disabled,
  className,
  children,
  ...rest
}: AddToCartButtonProps) {
  const utils = trpc.useUtils();
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const triggerFeedback = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setShowAddedFeedback(true);
    feedbackTimerRef.current = setTimeout(() => {
      setShowAddedFeedback(false);
    }, FEEDBACK_DURATION);
  };

  const addMutation = trpc.cart.add.useMutation({
    onSuccess: async () => {
      triggerFeedback();
      await utils.cart.list.invalidate();
    },
    onError: () => {
      alert("カートに追加できませんでした");
    },
  });

  const isBusy = addMutation.isPending;
  const buttonState = showAddedFeedback
    ? "added"
    : isBusy
      ? "busy"
      : "idle";

  const finalClassName = [
    "relative overflow-hidden transition-shadow duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
    showAddedFeedback ? "ring-2 ring-emerald-300" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      data-state={buttonState}
      className={finalClassName}
      disabled={disabled || isBusy}
      onClick={() => addMutation.mutate({ bookId, quantity: 1 })}
      {...rest}
    >
      <span
        aria-hidden={showAddedFeedback}
        className={`flex items-center justify-center gap-2 transition-all duration-200 ${
          showAddedFeedback ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {isBusy ? "追加中..." : children ?? "🛒 カートに入れる"}
      </span>

      <span
        aria-hidden={!showAddedFeedback}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 transition-all duration-500 ${
          showAddedFeedback ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <span aria-hidden className="text-lg">✅</span>
        カートに追加しました
      </span>

      <span className="sr-only" aria-live="polite" role="status">
        {showAddedFeedback ? "カートに商品を追加しました" : ""}
      </span>
    </button>
  );
}
