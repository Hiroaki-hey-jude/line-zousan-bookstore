import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { publicProcedure, router } from "../trpc";

const cartItemInput = z.object({
  bookId: z.string(),
  quantity: z.number().int().positive().max(99).default(1),
});

export const cartRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: ctx.userId },
      include: { book: { include: { taxRate: true } } },
      orderBy: { createdAt: "asc" },
    });

    return items.map((item) => {
      const taxRate = Number(item.book.taxRate.rate);
      const unitTax = Math.round(item.book.priceExTax * taxRate);

      return {
        ...item,
        unitTax,
        unitPriceIncTax: item.book.priceExTax + unitTax,
      };
    });
  }),

  add: publicProcedure.input(cartItemInput).mutation(async ({ ctx, input }) => {
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
      include: { taxRate: true },
    });

    if (!book) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "本が見つかりません。",
      });
    }

    if (!book.inStock) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "在庫切れのため追加できません。",
      });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_bookId: {
          userId: ctx.userId,
          bookId: input.bookId,
        },
      },
      create: {
        userId: ctx.userId,
        bookId: input.bookId,
        quantity: input.quantity,
      },
      update: {
        quantity: {
          increment: input.quantity,
        },
      },
      include: { book: { include: { taxRate: true } } },
    });

    const taxRate = Number(book.taxRate.rate);
    const unitTax = Math.round(book.priceExTax * taxRate);

    return {
      ...item,
      unitTax,
      unitPriceIncTax: book.priceExTax + unitTax,
    };
  }),

  updateQuantity: publicProcedure
    .input(
      z.object({
        id: z.string(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.cartItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "カートの商品が見つかりません。",
        });
      }

      return prisma.cartItem.update({
        where: { id: input.id },
        data: { quantity: input.quantity },
      });
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.cartItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "カートの商品が見つかりません。",
        });
      }

      await prisma.cartItem.delete({ where: { id: input.id } });

      return { id: input.id };
    }),
});
