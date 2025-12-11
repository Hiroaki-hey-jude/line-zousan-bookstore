import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { router, protectedProcedure } from "@/server/api/trpc";

const resolveAppUrl = () =>
  process.env.NEXT_PUBLIC_DOMAIN ??
  process.env.APP_URL ??
  "http://localhost:3000";

export const checkoutRouter = router({
  createSession: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripeClient();

      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { email: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "ユーザー情報を取得できません。",
        });
      }

      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "購入前にメールアドレスを設定してください。",
        });
      }

      const order = await prisma.order.findFirst({
        where: { id: input.orderId, userId: ctx.userId },
        include: {
          items: {
            include: { book: { select: { title: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "注文が見つかりませんでした。",
        });
      }

      if (order.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "明細のない注文では決済を開始できません。",
        });
      }

      const lineItems = order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "jpy",
          unit_amount: item.unitPriceIncTax,
          product_data: {
            name: item.book.title,
          },
        },
      }));

      const shippingTotal = order.shippingFeeExTax + order.shippingTax;
      if (shippingTotal > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: shippingTotal,
            product_data: {
              name: "Shipping Fee",
            },
          },
        });
      }

      const baseUrl = resolveAppUrl().replace(/\/$/, "");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        // payment_method_options: {
        //   card: {
        //     setup_future_usage: "none",   // 🔥 Link 無効化する最強オプション
        //   },
        // },
        line_items: lineItems,
        customer_email: user.email,
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
        cancel_url: `${baseUrl}/payment/cancel?orderId=${order.id}`,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe セッション URL の取得に失敗しました。",
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return { url: session.url };
    }),
});
