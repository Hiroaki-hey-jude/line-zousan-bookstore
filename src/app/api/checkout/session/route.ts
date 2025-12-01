import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/url";
import { ensureDemoUser } from "@/server/auth/demo-user";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .nonempty("カートが空です。"),
});

const fetchDefaultAddress = async (userId: string) => {
  const address = await prisma.userAddress.findFirst({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "asc" },
    ],
  });

  if (!address) {
    throw new Error("配送先住所が登録されていません。");
  }

  return address;
};

export const POST = async (req: Request) => {
  try {
    const json = await req.json();
    const { items } = checkoutSchema.parse(json);

    const user = await ensureDemoUser();
    const address = await fetchDefaultAddress(user.id);

    const books = await prisma.book.findMany({
      where: { id: { in: items.map((item) => item.bookId) } },
      include: { taxRate: true },
    });

    if (books.length !== items.length) {
      return NextResponse.json(
        { error: "存在しない本が含まれています。" },
        { status: 400 },
      );
    }

    const bookMap = new Map(books.map((book) => [book.id, book]));

    let subtotalExTax = 0;
    let taxTotal = 0;

    const lineItems = items.map((item) => {
      const book = bookMap.get(item.bookId);
      if (!book) {
        throw new Error("存在しない本が含まれています。");
      }

      if (!book.inStock) {
        throw new Error(`${book.title} は在庫切れです。`);
      }

      const taxRate = Number(book.taxRate.rate);
      const unitTax = Math.round(book.priceExTax * taxRate);
      const unitPriceIncTax = book.priceExTax + unitTax;

      subtotalExTax += book.priceExTax * item.quantity;
      taxTotal += unitTax * item.quantity;

      return {
        name: book.title,
        amount: unitPriceIncTax,
        quantity: item.quantity,
        bookId: book.id,
      };
    });

    const totalAmount = subtotalExTax + taxTotal;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        subtotalExTax,
        taxTotal,
        shippingFeeExTax: 0,
        shippingTax: 0,
        totalAmount,
        shipName: address.recipientName,
        shipPostalCode: address.postalCode,
        shipPrefecture: address.prefecture,
        shipCity: address.city,
        shipTownName: address.townName,
        shipChome: address.chome,
        shipHouseNumber: address.houseNumber,
        shipBuilding: address.building,
      },
    });

    const baseUrl = getBaseUrl(req);

    const session = await createCheckoutSession({
      lineItems,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/checkout/cancel`,
      orderId: order.id,
      userId: user.id,
    }).catch(async (error) => {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELED" },
      });
      throw error;
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      throw new Error("Stripe セッションURLの生成に失敗しました。");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const statusCode = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
};
