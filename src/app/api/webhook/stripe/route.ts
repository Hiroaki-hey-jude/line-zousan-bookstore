import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  listCheckoutSessionLineItems,
  verifyStripeSignature,
} from "@/lib/stripe";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

type CheckoutSessionCompleted = {
  id: string;
  metadata?: Record<string, string>;
  payment_intent?: string | null;
};

type PaymentIntentFailed = {
  metadata?: Record<string, string>;
  id: string;
};

const respond = (body: unknown, init?: number) =>
  NextResponse.json(body, { status: init ?? 200 });

const handleCheckoutCompleted = async (session: CheckoutSessionCompleted) => {
  if (!session.id) {
    throw new Error("checkout.session.completed payload is missing id");
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) {
    throw new Error("OrderId is missing in session metadata");
  }

  const lineItems = await listCheckoutSessionLineItems(session.id);
  const bookIds = lineItems
    .map((item) => {
      const product = item.price?.product as { metadata?: Record<string, string> };
      return product?.metadata?.bookId;
    })
    .filter((id): id is string => Boolean(id));

  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    include: { taxRate: true },
  });

  const bookMap = new Map(books.map((book) => [book.id, book]));

  const orderItems = lineItems.map((item) => {
    const product = item.price?.product as { metadata?: Record<string, string> };
    const bookId = product?.metadata?.bookId;
    const quantity = item.quantity ?? 0;

    if (!bookId || quantity <= 0) {
      throw new Error("Invalid line item data received from Stripe");
    }

    const book = bookMap.get(bookId);

    if (!book) {
      throw new Error(`Book not found for id ${bookId}`);
    }

    const taxRate = Number(book.taxRate.rate);
    const unitTax = Math.round(book.priceExTax * taxRate);
    const unitPriceIncTax = book.priceExTax + unitTax;

    return {
      bookId,
      quantity,
      unitPriceExTax: book.priceExTax,
      taxRate,
      taxAmount: unitTax,
      unitPriceIncTax,
    };
  });

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === "PAID") {
      if (!order.paymentIntentId && session.payment_intent) {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentIntentId: session.payment_intent },
        });
      }
      return;
    }

    const existingItems = await tx.orderItem.count({ where: { orderId } });

    if (existingItems === 0) {
      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({ ...item, orderId })),
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paymentIntentId: session.payment_intent ?? null,
      },
    });
  });
};

const handlePaymentFailed = async (paymentIntent: PaymentIntentFailed) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    return;
  }

  await prisma.order.updateMany({
    where: { id: orderId },
    data: { status: "CANCELED", paymentIntentId: paymentIntent.id },
  });
};

export const POST = async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return respond({ error: "Missing Stripe signature" }, 400);
  }

  const rawBody = await req.text();

  let isValid = false;
  try {
    isValid = verifyStripeSignature(rawBody, signature);
  } catch (error) {
    console.error("Stripe signature verification failed", error);
    return respond({ error: "Signature verification failed" }, 500);
  }

  if (!isValid) {
    return respond({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody) as StripeEvent;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as unknown as CheckoutSessionCompleted,
        );
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(event.data.object as PaymentIntentFailed);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return respond({ error: "Webhook handler error" }, 500);
  }

  return respond({ received: true });
};
