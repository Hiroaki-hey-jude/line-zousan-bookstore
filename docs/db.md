// Prisma Studioの開き方
npx prisma studio

// Prisma の schema（prisma/schema.prisma）を変更した後にやるべきこと
npx prisma migrate dev --name <適当な名前>

// 
INSERT INTO "Book" (
  id,
  title,
  author,
  isbn,
  "coverImage",  -- ここをダブルクォートで囲む
  "inStock",     -- これも
  description,
  "priceExTax",  -- これも
  "taxRateId",    -- これも
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '勝三郎の果樹園日記 遊び 学び 育てる',
  '中村勝三郎',
  '978-4990315061',
  'kaju.jpg',
  true,
  'この本は、新しい果樹栽培の指南書です。',
  1200,
  1,
  CURRENT_TIMESTAMP
);