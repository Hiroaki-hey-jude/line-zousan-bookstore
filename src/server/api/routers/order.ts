import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { publicProcedure, router } from "@/server/api/trpc";

const shippingInput = z.object({
  shipName: z.string(),
  shipPostalCode: z.string(),
  shipPrefecture: z.string(),
  shipCity: z.string(),
  shipTownName: z.string(),
  shipChome: z.string().optional(),
  shipHouseNumber: z.string().optional(),
  shipBuilding: z.string().optional(),
});

export const orderRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return prisma.order.findMany({
      where: { userId: ctx.userId },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          shipments: {
            orderBy: [{ createdAt: "asc" }],
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "注文が見つかりませんでした。",
        });
      }

      return order;
    }),

  createOrder: publicProcedure
    .input(
      z.union([
        z
          .object({
            fromCart: z.literal(true),
          })
          .and(shippingInput),
        z
          .object({
            fromCart: z.literal(false),
            bookId: z.string(),
            quantity: z.number().int().positive(),
          })
          .and(shippingInput),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      let items: {
        bookId: string;
        quantity: number;
        ex: number;
        rate: number;
        tax: number;
        inc: number;
      }[] = [];

      if (input.fromCart) {
        const cartItems = await prisma.cartItem.findMany({
          where: { userId },
          include: { book: { include: { taxRate: true } } },
        });

        if (cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "カートが空です。",
          });
        }

        const unavailable = cartItems.find((c) => !c.book.inStock);
        if (unavailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "在庫切れの商品がカートに含まれています。",
          });
        }

        items = cartItems.map((c) => {
          const rate = Number(c.book.taxRate?.rate ?? 0);
          const taxAmount = Math.round(c.book.priceExTax * rate);
          const inc = c.book.priceExTax + taxAmount;

          return {
            bookId: c.bookId,
            quantity: c.quantity,
            ex: c.book.priceExTax,
            rate,
            tax: taxAmount,
            inc,
          };
        });
      }

      if (!input.fromCart) {
        const book = await prisma.book.findUnique({
          where: { id: input.bookId },
          include: { taxRate: true },
        });

        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "書籍が見つかりませんでした。",
          });
        }

        if (!book.inStock) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "在庫切れのため購入できません。",
          });
        }

        const rate = Number(book.taxRate?.rate ?? 0);
        const taxAmount = Math.round(book.priceExTax * rate);
        const inc = book.priceExTax + taxAmount;

        items = [
          {
            bookId: input.bookId,
            quantity: input.quantity,
            ex: book.priceExTax,
            rate,
            tax: taxAmount,
            inc,
          },
        ];
      }

      const subtotalExTax = items.reduce(
        (acc, i) => acc + i.ex * i.quantity,
        0,
      );
      const taxTotal = items.reduce(
        (acc, i) => acc + i.tax * i.quantity,
        0,
      );
      const shippingFeeExTax = 0;
      const shippingTax = 0;

      const totalAmount =
        subtotalExTax + taxTotal + shippingFeeExTax + shippingTax;

      const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId,
            status: "PENDING",
            subtotalExTax,
            taxTotal,
            shippingFeeExTax,
            shippingTax,
            totalAmount,
            shipName: input.shipName,
            shipPostalCode: input.shipPostalCode,
            shipPrefecture: input.shipPrefecture,
            shipCity: input.shipCity,
            shipTownName: input.shipTownName,
            shipChome: input.shipChome ?? null,
            shipHouseNumber: input.shipHouseNumber ?? null,
            shipBuilding: input.shipBuilding ?? null,
          },
        });

        for (const i of items) {
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              bookId: i.bookId,
              quantity: i.quantity,
              unitPriceExTax: i.ex,
              taxRate: i.rate,
              taxAmount: i.tax,
              unitPriceIncTax: i.inc,
            },
          });
        }

        return createdOrder;
      });

      if (input.fromCart) {
        await prisma.cartItem.deleteMany({ where: { userId } });
      }

      return {
        orderId: order.id,
        amount: totalAmount,
      };
    }),
});
