// server/api/routers/book.ts
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma"; // tsconfig の paths で @ が有効な前提
import { z } from "zod";

export const bookRouter = router({
  // 本一覧
  list: publicProcedure.query(async () => {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });
    return books;
  }),

  // 本の詳細
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const book = await prisma.book.findUnique({
        where: { id: input.id },
      });
      return book;
    }),
});
