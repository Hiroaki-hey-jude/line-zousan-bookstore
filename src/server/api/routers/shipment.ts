import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { adminProcedure, router } from "@/server/api/trpc";

const shipmentStatus = z.enum(["READY", "SHIPPED", "DELIVERED", "CANCELED"]);

const dateField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return parsed;
}, z.date().optional());

const shipmentBase = z.object({
  carrier: z.string().min(1, "配送会社を入力してください"),
  trackingNumber: z.string().trim().optional(),
  status: shipmentStatus,
  shippedAt: dateField,
  deliveredAt: dateField,
  externalRawStatus: z.string().trim().optional(),
});

export const shipmentRouter = router({
  listRecent: adminProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;

      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
          shipments: { orderBy: { createdAt: "asc" } },
          items: {
            select: {
              quantity: true,
              book: { select: { title: true } },
            },
          },
        },
      });

      return orders;
    }),

  create: adminProcedure
    .input(
      shipmentBase.extend({
        orderId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.deliveredAt && input.shippedAt && input.deliveredAt < input.shippedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "配達日時は出荷日時以降に設定してください。",
        });
      }

      const order = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "注文が見つかりません。" });
      }

      const shipment = await prisma.shipment.create({
        data: {
          orderId: input.orderId,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber ?? null,
          status: input.status,
          shippedAt: input.shippedAt ?? null,
          deliveredAt: input.deliveredAt ?? null,
          externalRawStatus: input.externalRawStatus ?? null,
        },
      });

      return shipment;
    }),

  update: adminProcedure
    .input(
      shipmentBase.extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.deliveredAt && input.shippedAt && input.deliveredAt < input.shippedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "配達日時は出荷日時以降に設定してください。",
        });
      }

      const existing = await prisma.shipment.findUnique({ where: { id: input.id } });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "配送情報が見つかりません。" });
      }

      const shipment = await prisma.shipment.update({
        where: { id: input.id },
        data: {
          carrier: input.carrier,
          trackingNumber: input.trackingNumber ?? null,
          status: input.status,
          shippedAt: input.shippedAt ?? null,
          deliveredAt: input.deliveredAt ?? null,
          externalRawStatus: input.externalRawStatus ?? null,
        },
      });

      return shipment;
    }),
});
