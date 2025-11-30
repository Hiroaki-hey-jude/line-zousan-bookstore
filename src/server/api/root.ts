// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { orderRouter } from "./routers/order";
import { userAddressRouter } from "./routers/address";
import { cartRouter } from "./routers/cart";
import { userRouter } from "./routers/user";

export const appRouter = router({
  book: bookRouter,
  userAddress: userAddressRouter,
  order: orderRouter,
  cart: cartRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
