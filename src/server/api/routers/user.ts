import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        lineId: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ユーザー情報が見つかりません。",
      });
    }

    return user;
  }),

  updateEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.update({
        where: { id: ctx.userId },
        data: { email: input.email },
        select: {
          id: true,
          email: true,
        },
      });

      return user;
    }),
});
