// src/app/page.tsx
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (books.length === 0) {
    return <main className="p-4">本がまだ登録されていません。</main>;
  }

  return (
    <main className="p-4 space-y-4 bg-gray-50 min-h-screen">

      <ul className="space-y-4">
        {books.map((book) => (
          <li
            key={book.id}
            className="flex gap-3 rounded-lg border bg-white p-3 shadow-sm"
          >
            {/* 表紙 */}
            {book.coverImage && (
              <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* 本の情報 */}
            <div className="flex flex-1 flex-col gap-1">
              <div className="text-sm font-semibold text-black">{book.title}</div>
              {book.author && (
                <div className="text-xs text-gray-600">{book.author}</div>
              )}

              <div className="mt-1 text-sm">
                <span className="ml-1 text-xs text-red-500">
                  ¥ {Math.round(book.priceExTax * 1.1)}円
                </span>
              </div>

              <div className="text-xs">
                {book.inStock ? (
                  <span className="text-green-600">在庫あり</span>
                ) : (
                  <span className="text-red-600">在庫なし</span>
                )}
              </div>

              {/* カートボタン（まだ見た目だけ） */}
              <div className="mt-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded bg-yellow-400 px-3 py-1 text-xs font-semibold text-black hover:bg-yellow-500 disabled:bg-gray-300"
                  disabled={!book.inStock}
                >
                  🛒 カートに入れる
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
