// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";

export const appRouter = router({
  book: bookRouter,
});

export type AppRouter = typeof appRouter;
