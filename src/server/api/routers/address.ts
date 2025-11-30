// server/api/routers/address.ts
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressInputSchema = z.object({
  label: z.string().min(1, "ラベルは必須です。"),
  recipientName: z.string().min(1, "受取人は必須です。"),
  postalCode: z.string().min(1, "郵便番号は必須です。"),
  prefecture: z.string().min(1, "都道府県は必須です。"),
  city: z.string().min(1, "市区町村は必須です。"),
  townName: z.string().min(1, "町名は必須です。"),
  chome: z.string().optional(),
  houseNumber: z.string().optional(),
  building: z.string().optional(),
  phone: z.string().min(1, "電話番号は必須です。"),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = addressInputSchema.extend({
  id: z.string(),
});

type AddressInput = z.infer<typeof addressInputSchema>;

const normalizeOptionalField = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeAddressPayload = (input: AddressInput) => ({
  label: input.label.trim(),
  recipientName: input.recipientName.trim(),
  postalCode: input.postalCode.trim(),
  prefecture: input.prefecture.trim(),
  city: input.city.trim(),
  townName: input.townName.trim(),
  chome: normalizeOptionalField(input.chome),
  houseNumber: normalizeOptionalField(input.houseNumber),
  building: normalizeOptionalField(input.building),
  phone: input.phone.trim(),
});

const ensureDefaultExists = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  const hasDefault = await tx.userAddress.findFirst({
    where: { userId, isDefault: true },
    select: { id: true },
  });

  if (hasDefault) {
    return;
  }

  const fallback = await tx.userAddress.findFirst({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true },
  });

  if (fallback) {
    await tx.userAddress.update({
      where: { id: fallback.id },
      data: { isDefault: true },
    });
  }
};

export const userAddressRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return prisma.userAddress.findMany({
      where: { userId: ctx.userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
  }),

  create: publicProcedure
    .input(addressInputSchema)
    .mutation(async ({ ctx, input }) => {
      const payload = normalizeAddressPayload(input);
      const requestedDefault = input.isDefault ?? false;

      return prisma.$transaction(async (tx) => {
        const hasDefault = await tx.userAddress.count({
          where: { userId: ctx.userId, isDefault: true },
        });

        const shouldBeDefault = requestedDefault || hasDefault === 0;

        if (shouldBeDefault) {
          await tx.userAddress.updateMany({
            where: { userId: ctx.userId },
            data: { isDefault: false },
          });
        }

        return tx.userAddress.create({
          data: {
            ...payload,
            userId: ctx.userId,
            isDefault: shouldBeDefault,
          },
        });
      });
    }),

  update: publicProcedure
    .input(updateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const payload = normalizeAddressPayload(rest);
      const requestedDefault = rest.isDefault;

      return prisma.$transaction(async (tx) => {
        const existing = await tx.userAddress.findFirst({
          where: { id, userId: ctx.userId },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "住所が見つかりません。",
          });
        }

        if (requestedDefault === true) {
          await tx.userAddress.updateMany({
            where: { userId: ctx.userId, NOT: { id } },
            data: { isDefault: false },
          });
        }

        const nextIsDefault =
          typeof requestedDefault === "boolean"
            ? requestedDefault
            : existing.isDefault;

        const updated = await tx.userAddress.update({
          where: { id },
          data: {
            ...payload,
            isDefault: nextIsDefault,
          },
        });

        if (!updated.isDefault) {
          await ensureDefaultExists(tx, ctx.userId);
        }

        return updated;
      });
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(async (tx) => {
        const target = await tx.userAddress.findFirst({
          where: { id: input.id, userId: ctx.userId },
        });

        if (!target) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "住所が見つかりません。",
          });
        }

        await tx.userAddress.delete({
          where: { id: input.id },
        });

        if (target.isDefault) {
          await ensureDefaultExists(tx, ctx.userId);
        }
      });
    }),

  setDefault: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(async (tx) => {
        const target = await tx.userAddress.findFirst({
          where: { id: input.id, userId: ctx.userId },
        });

        if (!target) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "住所が見つかりません。",
          });
        }

        await tx.userAddress.updateMany({
          where: { userId: ctx.userId },
          data: { isDefault: false },
        });

        return tx.userAddress.update({
          where: { id: input.id },
          data: { isDefault: true },
        });
      });
    }),
});
