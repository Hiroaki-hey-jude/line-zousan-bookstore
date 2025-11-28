// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { userAddressRouter } from "./routers/address";

export const appRouter = router({
  book: bookRouter,
  userAddress: userAddressRouter
});

export type AppRouter = typeof appRouter;
