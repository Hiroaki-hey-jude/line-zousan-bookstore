import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { BookDescription } from "@/components/BookDescription";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BuyNowButton } from "@/components/BuyNowButton";

const TAX_RATE = 1.1;

export default async function BookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const bookId = id.trim();
  if (!bookId) return notFound();

  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) return notFound();

  const priceIncTax = Math.round(book.priceExTax * TAX_RATE);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <span className="text-lg">←</span> トップページへ戻る
        </Link>

        <section className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
          <div className="grid gap-8 p-6 md:grid-cols-[240px,1fr] md:p-10">
            {/* 画像 */}
            <div className="relative mx-auto h-72 w-48 md:mx-0 md:h-80 md:w-56">
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className="rounded-xl object-cover shadow-md"
                  sizes="(max-width: 768px) 192px, 224px"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
                  No Image
                </div>
              )}
            </div>

            {/* 情報 */}
            <div className="flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                New Release
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
                  {book.title}
                </h1>
                <p className="text-sm font-medium text-gray-600">{book.author}</p>
              </div>

              {/* 価格 */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-3xl font-bold text-gray-900">
                  ¥{priceIncTax.toLocaleString()}
                  <span className="ml-1 text-base font-semibold text-gray-500">税込</span>
                </div>
                <div className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  本体 ¥{book.priceExTax.toLocaleString()}
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    book.inStock
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {book.inStock ? "在庫あり" : "在庫なし"}
                </div>
              </div>

              {/* ▼ 説明（折りたたみ対応） */}
              {book.description && (
                <BookDescription text={book.description} />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <AddToCartButton
                  bookId={book.id}
                  className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-500 disabled:bg-gray-300"
                  disabled={!book.inStock}
                >
                  🛒 カートに入れる
                </AddToCartButton>
                <BuyNowButton
                  bookId={book.id}
                  bookTitle={book.title}
                  unitPriceIncTax={priceIncTax}
                  disabled={!book.inStock}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:bg-gray-400"
                >
                  ⚡ 今すぐ買う
                </BuyNowButton>
              </div>

              {/* ISBN 等 */}
              <dl className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">ISBN</dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {book.isbn || "未登録"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">税率</dt>
                  <dd className="mt-1 font-semibold text-gray-900">10%</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
