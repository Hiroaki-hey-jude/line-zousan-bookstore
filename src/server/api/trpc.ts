// server/api/trpc.ts
import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * コンテキスト（認証情報とかを入れたいときに使う）
 * 今は何もないので空オブジェクトを返す
 */
export async function createTRPCContext({ req }: { req: Request }) {
  // デモユーザーを返す
  const user = await prisma.user.upsert({
    where: { lineId: "demo-line-user" },
    update: {},
    create: {
      lineId: "demo-line-user",
      name: "像倉 花子",
      email: "demo@example.com",
    },
  });

  return { userId: user.id };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
// 認証が必要なAPIを作るときはここで middleware を増やしていくイメージ
