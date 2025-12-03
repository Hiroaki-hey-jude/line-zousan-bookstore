import { TRPCError } from "@trpc/server";

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
});
