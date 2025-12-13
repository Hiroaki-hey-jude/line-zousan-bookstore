"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { trpc } from "@/trpc/react";

const formatCurrency = (amount: number) =>
  amount.toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  });

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const statusStyle = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const orderQuery = trpc.order.byId.useQuery({ id: id ?? "" }, { enabled: Boolean(id) });

  const order = orderQuery.data;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500">注文詳細</p>
          <h1 className="text-2xl font-bold text-gray-900">注文 {id}</h1>
          <p className="text-sm text-gray-600">注文の状態や配送先、購入明細を確認できます。</p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          ← プロフィールに戻る
        </Link>
      </header>

      {orderQuery.isLoading ? (
        <p className="text-sm text-gray-500">注文情報を読み込み中です…</p>
      ) : orderQuery.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          注文情報の取得に失敗しました：{orderQuery.error.message}
        </p>
      ) : !order ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">注文が見つかりませんでした。</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-500">注文日時</p>
                <p className="text-base font-semibold text-gray-900">{formatDateTime(order.createdAt)}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <dt className="text-xs font-semibold text-gray-500">合計</dt>
                <dd className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <dt className="text-xs font-semibold text-gray-500">ステータス</dt>
                <dd className="text-sm font-semibold text-gray-900">{order.status}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">配送先情報</h2>
            <p className="mt-1 text-xs text-gray-500">注文時点の配送先住所です。</p>

            <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <p className="font-semibold">{order.shipName}</p>
                <p className="text-xs text-gray-500">受取人</p>
              </div>
              <div>
                <p>〒 {order.shipPostalCode}</p>
                <p>
                  {order.shipPrefecture}
                  {order.shipCity}
                  {order.shipTownName}
                  {order.shipChome ?? ""}
                  {order.shipHouseNumber ?? ""}
                </p>
                {order.shipBuilding && <p>{order.shipBuilding}</p>}
                <p className="text-xs text-gray-500">配送先住所</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">購入商品</h2>
                <p className="text-xs text-gray-500">数量や金額の詳細です。</p>
              </div>
              <span className="text-xs text-gray-500">{order.items.length} 商品</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">商品名</th>
                    <th className="px-4 py-3">数量</th>
                    <th className="px-4 py-3">単価（税込）</th>
                    <th className="px-4 py-3 text-right">小計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => {
                    const lineTotal = item.unitPriceIncTax * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.book.title}</td>
                        <td className="px-4 py-3 text-gray-800">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-800">{formatCurrency(item.unitPriceIncTax)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">商品小計</span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.subtotalExTax + order.taxTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">送料</span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.shippingFeeExTax + order.shippingTax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>合計</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">配送状況</h2>
                <p className="text-xs text-gray-500">出荷や配達の進捗を確認できます。</p>
              </div>
              <span className="text-xs text-gray-500">{order.shipments.length} 件</span>
            </div>

            {order.shipments.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">配送情報はまだありません。</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {order.shipments.map((shipment) => (
                  <li key={shipment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{shipment.carrier}</p>
                        <p className="text-xs text-gray-500">配送会社</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                        {shipment.status}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                      {shipment.trackingNumber && (
                        <div>
                          <p className="font-semibold">{shipment.trackingNumber}</p>
                          <p className="text-gray-500">追跡番号</p>
                        </div>
                      )}
                      {shipment.shippedAt && (
                        <div>
                          <p className="font-semibold">{formatDateTime(shipment.shippedAt)}</p>
                          <p className="text-gray-500">出荷日時</p>
                        </div>
                      )}
                      {shipment.deliveredAt && (
                        <div>
                          <p className="font-semibold">{formatDateTime(shipment.deliveredAt)}</p>
                          <p className="text-gray-500">配達完了日時</p>
                        </div>
                      )}
                    </div>

                    {shipment.externalRawStatus && (
                      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-700">
                        {shipment.externalRawStatus}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
