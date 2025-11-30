import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { publicProcedure, router } from "../trpc";

const cartItemInput = z.object({
  bookId: z.string(),
  quantity: z.number().int().positive().max(99),
});

export const cartRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return prisma.cartItem.findMany({
      where: { userId: ctx.userId },
      include: {
        book: { include: { taxRate: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  add: publicProcedure
    .input(cartItemInput)
    .mutation(async ({ ctx, input }) => {
      const book = await prisma.book.findUnique({ where: { id: input.bookId } });

      console.log("🧪 cart.add ctx.userId:", ctx.userId, typeof ctx.userId);
      console.log("🧪 cart.add input.bookId:", input.bookId);


      if (!book) {
        throw new TRPCError({ code: "NOT_FOUND", message: "本が見つかりません。" });
      }

      if (!book.inStock) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "在庫切れの本は追加できません。",
        });
      }

      return prisma.cartItem.upsert({
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
      });
    }),

  updateQuantity: publicProcedure
    .input(
      z.object({
        bookId: z.string(),
        quantity: z.number().int().min(0).max(99),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_bookId: {
            userId: ctx.userId,
            bookId: input.bookId,
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "カートに存在しません。" });
      }

      if (input.quantity === 0) {
        await prisma.cartItem.delete({
          where: { userId_bookId: { userId: ctx.userId, bookId: input.bookId } },
        });
        return null;
      }

      return prisma.cartItem.update({
        where: { userId_bookId: { userId: ctx.userId, bookId: input.bookId } },
        data: { quantity: input.quantity },
      });
    }),

  remove: publicProcedure
    .input(z.object({ bookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_bookId: {
            userId: ctx.userId,
            bookId: input.bookId,
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "カートに存在しません。" });
      }

      await prisma.cartItem.delete({
        where: { userId_bookId: { userId: ctx.userId, bookId: input.bookId } },
      });

      return existing;
    }),
});
