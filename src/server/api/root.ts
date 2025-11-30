// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { orderRouter } from "./routers/order";
import { userAddressRouter } from "./routers/address";
import { cartRouter } from "./routers/cart";

export const appRouter = router({
  book: bookRouter,
  userAddress: userAddressRouter,
  order: orderRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;
