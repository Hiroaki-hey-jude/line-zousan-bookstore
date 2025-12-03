import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // ① LINE の ID Token を検証
      const form = new URLSearchParams({
        id_token: input.idToken,
        client_id: process.env.LINE_CHANNEL_ID!,
      });
      console.log('今日');

      console.log("verify client_id =", process.env.LINE_CHANNEL_ID);
      console.log("verify idToken = ", input.idToken);


      const res = await fetch(LINE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });

      console.log(form, ' = form')

      

      if (!res.ok) throw new Error("LINE verify failed");

      const payload = await res.json(); // sub, name, email 等
      const lineId = payload.sub;

      // ② User を DB に upsert
      const user = await prisma.user.upsert({
        where: { lineId },
        update: {
          name: payload.name ?? undefined,
          email: payload.email ?? undefined,
        },
        create: {
          lineId,
          name: payload.name ?? null,
          email: payload.email ?? null,
        },
      });

      // ③ sessionToken を生成（JWT）
      const sessionToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
      );


      return { sessionToken, user };
    }),
});
