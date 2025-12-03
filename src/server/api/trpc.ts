import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

type SessionTokenPayload = {
  userId: string;
  iat: number;
  exp: number;
};

// ===== Context =====
export async function createTRPCContext({ req }: { req: Request }) {
  const auth = req.headers.get("authorization");
  if (!auth) return { userId: null };

  const token = auth.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as SessionTokenPayload;

    return { userId: payload.userId };
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

// router
export const router = t.router;
