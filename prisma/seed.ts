// prisma/seed.ts
import "dotenv/config";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "crypto";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🌱 Seeding started...");

  // 削除順序（重要）
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.book.deleteMany();
  await prisma.taxRate.deleteMany();

  // 標準税率 10%
  const standardTaxRate = await prisma.taxRate.create({
    data: {
      name: "標準税率10%",
      rate: new Prisma.Decimal(10),
      validFrom: new Date("2019-10-01"),
    },
  });

  // Book データ
  const booksData = [
    {
      title: "世界で勝負するならロサンゼルスで寿司を学べ!",
      author: "アンディー松田",
      priceExTax: 1500,
      coverImage: "/books/sushi.jpg",
    },
    {
      title: "いただきますの山: 昆虫食ガール 狩猟女子 里山移住物語",
      author: "束元理恵",
      priceExTax: 1500,
      coverImage: "/books/syuryo.jpg",
    },
    {
      title: "養老先生のさかさま人間学",
      author: "養老孟司",
      priceExTax: 1400,
      coverImage: "/books/youro.jpg",
    },
  ];

  await prisma.book.createMany({
    data: booksData.map((b) => ({
      id: randomUUID(),
      ...b,
      isbn: null,
      description: null,
      inStock: true,
      taxRateId: standardTaxRate.id,
    })),
  });

  const books = await prisma.book.findMany();
  console.log(`📚 Book created: ${books.length}`);

  // ───────────────────────────────
  // 👤 User + UserAddress
  // ───────────────────────────────
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      lineId: "dummy-line-id",
      name: "テストユーザー",
      email: "test@example.com",
      addresses: {
        create: {
          label: "自宅",
          recipientName: "テストユーザー",
          postalCode: "1500001",
          prefecture: "東京都",
          city: "渋谷区",
          townName: "神宮前",
          phone: "08000000000",
          isDefault: true,
        },
      },
    },
    include: {
      addresses: true,
    },
  });

  const addr = user.addresses[0];
  console.log("🏠 User + Address created");

  // ───────────────────────────────
  // 🧾 Order（住所必須）
  // ───────────────────────────────
  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      status: "PENDING",

      // 金額はあとで更新するので仮値
      subtotalExTax: 0,
      taxTotal: 0,
      shippingFeeExTax: 0,
      shippingTax: 0,
      totalAmount: 0,

      // 住所：UserAddress をコピー
      shipName: addr.recipientName,
      shipPostalCode: addr.postalCode,
      shipPrefecture: addr.prefecture,
      shipCity: addr.city,
      shipTownName: addr.townName,
      shipChome: addr.chome,
      shipHouseNumber: addr.houseNumber,
      shipBuilding: addr.building,
    },
  });

  console.log("🧾 Order created:", order.id);

  // ───────────────────────────────
  // 📦 OrderItem 作成
  // ───────────────────────────────
  const targetBooks = books.slice(0, 2); // 2冊購入した想定

  const orderItemsData = targetBooks.map((book) => {
    const unitPriceExTax = book.priceExTax;
    const taxRate = new Prisma.Decimal(10);
    const taxAmount = Math.floor(unitPriceExTax * 0.1);
    const unitPriceIncTax = unitPriceExTax + taxAmount;

    return {
      id: randomUUID(),
      orderId: order.id,
      bookId: book.id,
      quantity: 1,
      unitPriceExTax,
      taxRate,
      taxAmount,
      unitPriceIncTax,
    };
  });

  await prisma.orderItem.createMany({ data: orderItemsData });

  console.log("📦 OrderItem created:", orderItemsData.length);

  // ───────────────────────────────
  // 💰 Order 金額をアップデート
  // ───────────────────────────────
  const subtotalExTax = orderItemsData.reduce(
    (sum, i) => sum + i.unitPriceExTax * i.quantity,
    0,
  );
  const taxTotal = orderItemsData.reduce(
    (sum, i) => sum + i.taxAmount * i.quantity,
    0,
  );

  await prisma.order.update({
    where: { id: order.id },
    data: {
      subtotalExTax,
      taxTotal,
      totalAmount: subtotalExTax + taxTotal,
    },
  });

  console.log("💰 Order total updated!");

  // ───────────────────────────────
  // 🚚 Shipment 作成
  // ───────────────────────────────
  await prisma.shipment.create({
    data: {
      id: randomUUID(),
      orderId: order.id,
      carrier: "yamato",
      status: "READY",
    },
  });

  console.log("🚚 Shipment created!");

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

