// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "@/components/AddToCartButton";

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
        {books.map((book) => {
          const priceIncTax = Math.round(book.priceExTax * 1.1);

          return (
            <li
              key={book.id}
              className="overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link
                href={`/books/${book.id}`}
                className="group flex gap-3 p-3"
              >
                {/* 表紙 */}
                {book.coverImage ? (
                  <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      className="object-cover transition duration-200 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-24 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                    No Image
                  </div>
                )}

                {/* 本の情報 */}
                <div className="flex flex-1 flex-col gap-1">
                  <div className="text-sm font-semibold text-black">{book.title}</div>
                  {book.author && (
                    <div className="text-xs text-gray-600">{book.author}</div>
                  )}

                  <div className="mt-1 text-sm">
                    <span className="ml-1 text-xs font-semibold text-red-500">
                      ¥ {priceIncTax.toLocaleString()}円
                    </span>
                  </div>

                  <div className="text-xs font-medium">
                    {book.inStock ? (
                      <span className="text-green-600">在庫あり</span>
                    ) : (
                      <span className="text-red-600">在庫なし</span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="border-t px-3 pb-3">
                <AddToCartButton
                  bookId={book.id}
                  className="mt-3 inline-flex w-full items-center justify-center rounded bg-yellow-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-yellow-500 disabled:bg-gray-300"
                  disabled={!book.inStock}
                >
                  🛒 カートに入れる
                </AddToCartButton>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
