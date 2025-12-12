import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

import { readAdminSession } from "@/lib/admin";

type SessionTokenPayload = {
  userId: string;
  iat: number;
  exp: number;
};

// ===== Context =====
export async function createTRPCContext({ req }: { req: Request }) {
  const auth = req.headers.get("authorization");
  const adminSession = await readAdminSession(req);

  if (!auth) return { userId: null, isAdmin: Boolean(adminSession) };

  const token = auth.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as SessionTokenPayload;

    return {
      userId: payload.userId,
      isAdmin: Boolean(adminSession),
    };
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired" });
  }
}

// ⭕️ 正しい context 型の与え方
type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
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

// ===== 公開/保護プロシージャ =====
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "ログインしてください。",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "ログインしてください。",
    });
  }

  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者権限が必要です。",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      isAdmin: true,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);

// router
export const router = t.router;
