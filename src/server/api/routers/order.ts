import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { publicProcedure, router } from "../trpc";

const orderItemInput = z.object({
  bookId: z.string(),
  quantity: z.number().int().positive(),
});

const orderCreateInput = z.object({
  items: z.array(orderItemInput).nonempty("注文商品を1つ以上追加してください。"),
  shippingAddressId: z.string().optional(),
  shippingFeeExTax: z.number().int().min(0).default(0),
  shippingTaxRate: z.number().min(0).default(0.1),
});

const ensureAddress = async (
  tx: Prisma.TransactionClient,
  userId: string,
  addressId?: string,
) => {
  if (addressId) {
    const address = await tx.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "配送先住所が見つかりません。",
      });
    }

    return address;
  }

  const fallback = await tx.userAddress.findFirst({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "asc" },
    ],
  });

  if (!fallback) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "配送先住所を登録してください。",
    });
  }

  return fallback;
};

const fetchBooksWithTax = async (bookIds: string[]) => {
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    include: { taxRate: true },
  });

  if (books.length !== bookIds.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "存在しない本が含まれています。",
    });
  }

  return books;
};

export const orderRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return prisma.order.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { book: true },
        },
      },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          items: { include: { book: true } },
          shipments: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "注文が見つかりません。",
        });
      }

      return order;
    }),

  byStripeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: input.sessionId, userId: ctx.userId },
        include: {
          items: { include: { book: true } },
          shipments: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "注文が見つかりません。",
        });
      }

      return order;
    }),

  create: publicProcedure
    .input(orderCreateInput)
    .mutation(async ({ ctx, input }) => {
      const bookIds = input.items.map((item) => item.bookId);

      return prisma.$transaction(async (tx) => {
        const address = await ensureAddress(tx, ctx.userId, input.shippingAddressId);
        const books = await fetchBooksWithTax(bookIds);

        const bookMap = new Map(books.map((book) => [book.id, book]));

        let subtotalExTax = 0;
        let taxTotal = 0;

        const orderItems: Prisma.OrderItemCreateManyOrderInput[] = input.items.map((item) => {
          const book = bookMap.get(item.bookId);
          if (!book) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "存在しない本が含まれています。",
            });
          }

          if (!book.inStock) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${book.title} は在庫切れです。`,
            });
          }

          const taxRate = Number(book.taxRate.rate);
          const unitPriceExTax = book.priceExTax;
          const unitTax = Math.round(unitPriceExTax * taxRate);
          const lineTax = unitTax * item.quantity;
          const lineSubtotal = unitPriceExTax * item.quantity;

          subtotalExTax += lineSubtotal;
          taxTotal += lineTax;

          return {
            bookId: book.id,
            quantity: item.quantity,
            unitPriceExTax,
            taxRate,
            taxAmount: unitTax,
            unitPriceIncTax: unitPriceExTax + unitTax,
          };
        });

        const shippingTax = Math.round(
          input.shippingFeeExTax * input.shippingTaxRate,
        );

        const totalAmount =
          subtotalExTax + taxTotal + input.shippingFeeExTax + shippingTax;

        const order = await tx.order.create({
          data: {
            userId: ctx.userId,
            status: "PENDING",
            subtotalExTax,
            taxTotal,
            shippingFeeExTax: input.shippingFeeExTax,
            shippingTax,
            totalAmount,
            shipName: address.recipientName,
            shipPostalCode: address.postalCode,
            shipPrefecture: address.prefecture,
            shipCity: address.city,
            shipTownName: address.townName,
            shipChome: address.chome,
            shipHouseNumber: address.houseNumber,
            shipBuilding: address.building,
            items: {
              createMany: {
                data: orderItems,
              },
            },
          },
          include: {
            items: true,
          },
        });

        return order;
      });
    }),
});
