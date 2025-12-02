// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { userAddressRouter } from "./routers/address";
import { cartRouter } from "./routers/cart";
import { userRouter } from "./routers/user";
import { orderRouter } from "./routers/order";
import { checkoutRouter } from "./routers/checkout";

export const appRouter = router({
  book: bookRouter,
  userAddress: userAddressRouter,
  order: orderRouter,
  cart: cartRouter,
  user: userRouter,
  checkout: checkoutRouter,
});

export type AppRouter = typeof appRouter;
