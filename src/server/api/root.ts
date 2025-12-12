// server/api/root.ts
import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { userAddressRouter } from "./routers/address";
import { cartRouter } from "./routers/cart";
import { userRouter } from "./routers/user";
import { orderRouter } from "./routers/order";
import { checkoutRouter } from "./routers/checkout";
import { authRouter } from "./routers/auth";
import { shipmentRouter } from "./routers/shipment";

export const appRouter = router({
  book: bookRouter,
  userAddress: userAddressRouter,
  order: orderRouter,
  cart: cartRouter,
  user: userRouter,
  checkout: checkoutRouter,
  auth: authRouter,
  shipment: shipmentRouter,
});

export type AppRouter = typeof appRouter;
