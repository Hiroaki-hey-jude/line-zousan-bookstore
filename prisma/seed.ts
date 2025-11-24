// prisma/seed.ts
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log("🌱 Seeding started...");

  // 関連データの削除（順番が大事）
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.book.deleteMany();
  await prisma.taxRate.deleteMany();

  // 標準税率10%を作成
  const standardTaxRate = await prisma.taxRate.create({
    data: {
      name: "標準税率10%",
      rate: new Prisma.Decimal(10),
      validFrom: new Date("2019-10-01"),
      validTo: null,
    },
  });

  // 書籍データ
  const books = [
    {
      title: "世界で勝負するならロサンゼルスで寿司を学べ!",
      author: "アンディー松田",
      priceExTax: 1500,
      isbn: null,
      coverImage: "/books/sushi.jpg",
      inStock: true,
    },
    {
      title: "いただきますの山: 昆虫食ガール 狩猟女子 里山移住物語",
      author: "束元理恵",
      priceExTax: 1500,
      isbn: null,
      coverImage: "/books/syuryo.jpg",
      inStock: true,
    },
    {
      title: "養老先生のさかさま人間学",
      author: "養老孟司",
      priceExTax: 1400,
      isbn: null,
      coverImage: "/books/youro.jpg",
      inStock: true,
    },
    {
      title: "Think Galaxy 銀河レベルで考えろ",
      author: "井筒智彦",
      priceExTax: 1400,
      isbn: null,
      coverImage: "/books/think.jpg",
      inStock: true,
    },
    {
      title: "冒険起業家 ゾウのウンチが世界を変える。",
      author: "植田紘栄志",
      priceExTax: 1400,
      isbn: null,
      coverImage: "/books/bouken.jpg",
      inStock: true,
    },
  ];

  // Book 登録
  await prisma.book.createMany({
    data: books.map((b) => ({
      id: randomUUID(),
      ...b,
      taxRateId: standardTaxRate.id,
    })),
  });

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
