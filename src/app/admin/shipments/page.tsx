"use client";

import { useMemo, useState } from "react";

import type { inferRouterOutputs } from "@trpc/server";
import type { ShipmentStatus } from "@prisma/client";

import type { AppRouter } from "@/server/api/root";
import { trpc } from "@/trpc/react";

const carrierOptions = [
  "ヤマト",
  "佐川急便",
  "日本郵便",
  "FedEx",
  "DHL",
  "その他",
];

const statusOptions: ShipmentStatus[] = [
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

type StatusFilter = "ALL" | "READY" | "SHIPPED" | "DELIVERED";

const statusFilterOptions: { label: string; value: StatusFilter }[] = [
  { label: "すべて", value: "ALL" },
  { label: "Ready", value: "READY" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const dateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

type ShipmentFormState = {
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippedAt: string;
  deliveredAt: string;
  externalRawStatus: string;
};

const shipmentStatusBadge = (status: ShipmentStatus) => {
  switch (status) {
    case "READY":
      return "bg-amber-100 text-amber-800";
    case "SHIPPED":
      return "bg-blue-100 text-blue-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELED":
    default:
      return "bg-red-100 text-red-800";
  }
};

type RouterOutputs = inferRouterOutputs<AppRouter>;
type OrderWithShipments = RouterOutputs["shipment"]["listRecent"][number];

export default function AdminShipmentsPage() {
  const utils = trpc.useUtils();
  const recentOrders = trpc.shipment.listRecent.useQuery({ limit: 20 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filteredOrders = useMemo(() => {
    if (!recentOrders.data) return [];
    if (statusFilter === "ALL") return recentOrders.data;

    return recentOrders.data
      .map((order) => ({
        ...order,
        shipments: order.shipments.filter((shipment) => shipment.status === statusFilter),
      }))
      .filter((order) => order.shipments.length > 0);
  }, [recentOrders.data, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-900">配送管理</h2>
        <p className="text-sm text-gray-600">
          Stripe Webhook で自動作成された配送情報を含め、注文ごとに配送会社・追跡番号・ステータスを更新できます。
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {statusFilterOptions.map((option) => {
          const isActive = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full border px-3 py-1 font-semibold transition ${
                isActive
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {recentOrders.isLoading && (
        <p className="text-sm text-gray-500">読み込み中です…</p>
      )}
      {recentOrders.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          配送情報の取得に失敗しました：{recentOrders.error.message}
        </p>
      )}

      <div className="space-y-4">
        {filteredOrders.length === 0 && !recentOrders.isLoading && (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-600">
            選択したステータスの配送は見つかりませんでした。
          </p>
        )}
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            invalidate={() => utils.shipment.listRecent.invalidate()}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  invalidate,
}: {
  order: OrderWithShipments;
  invalidate: () => Promise<void>;
}) {
  const itemsText = useMemo(
    () => order.items.map((item) => `${item.book.title} x${item.quantity}`).join(", "),
    [order.items],
  );

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500">注文ID</p>
          <p className="font-mono text-sm font-semibold text-gray-900">{order.id}</p>
          <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="text-sm text-gray-700">
          <p className="font-semibold">配送先: {order.shipName}</p>
          <p className="text-xs text-gray-500">購入者: {order.user?.name ?? "-"}</p>
          <p className="text-xs text-gray-500">{itemsText}</p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {order.shipments.length === 0 ? (
          <p className="text-sm text-gray-600">まだ配送レコードはありません。</p>
        ) : (
          order.shipments.map((shipment) => (
            <ShipmentEditor
              key={shipment.id}
              shipment={shipment}
              invalidate={invalidate}
            />
          ))
        )}

        <NewShipmentForm orderId={order.id} invalidate={invalidate} />
      </div>
    </div>
  );
}

function ShipmentEditor({
  shipment,
  invalidate,
}: {
  shipment: OrderWithShipments["shipments"][number];
  invalidate: () => Promise<void>;
}) {
  const [form, setForm] = useState<ShipmentFormState>({
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber ?? "",
    status: shipment.status,
    shippedAt: dateInputValue(shipment.shippedAt),
    deliveredAt: dateInputValue(shipment.deliveredAt),
    externalRawStatus: shipment.externalRawStatus ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateShipment = trpc.shipment.update.useMutation({
    onSuccess: async () => {
      setMessage("更新しました");
      setError(null);
      await invalidate();
    },
    onError: (err) => {
      setError(err.message);
      setMessage(null);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    updateShipment.mutate({
      id: shipment.id,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber || undefined,
      status: form.status,
      shippedAt: form.shippedAt ? new Date(form.shippedAt) : undefined,
      deliveredAt: form.deliveredAt ? new Date(form.deliveredAt) : undefined,
      externalRawStatus: form.externalRawStatus || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">配送ID: {shipment.id}</p>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${shipmentStatusBadge(form.status)}`}
        >
          {form.status}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          配送会社
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            value={form.carrier}
            onChange={(e) => setForm((prev) => ({ ...prev, carrier: e.target.value }))}
          >
            {carrierOptions.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          追跡番号
          <input
            type="text"
            value={form.trackingNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="例: 1234-5678"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          ステータス
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ShipmentStatus }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          出荷日時
          <input
            type="datetime-local"
            value={form.shippedAt}
            onChange={(e) => setForm((prev) => ({ ...prev, shippedAt: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">現在: {formatDateTime(shipment.shippedAt)}</p>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          配達完了日時
          <input
            type="datetime-local"
            value={form.deliveredAt}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveredAt: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">現在: {formatDateTime(shipment.deliveredAt)}</p>
        </label>

        <label className="space-y-1 text-sm text-gray-700 sm:col-span-2">
          外部ステータスメモ
          <textarea
            value={form.externalRawStatus}
            onChange={(e) => setForm((prev) => ({ ...prev, externalRawStatus: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="API などから取得した生ステータスをメモできます"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="submit"
          disabled={updateShipment.isPending}
          className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {updateShipment.isPending ? "保存中…" : "保存"}
        </button>
        {message && <span className="text-green-600">{message}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </form>
  );
}

function NewShipmentForm({
  orderId,
  invalidate,
}: {
  orderId: string;
  invalidate: () => Promise<void>;
}) {
  const [form, setForm] = useState<ShipmentFormState>({
    carrier: carrierOptions[0] ?? "ヤマト",
    trackingNumber: "",
    status: "READY",
    shippedAt: "",
    deliveredAt: "",
    externalRawStatus: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createShipment = trpc.shipment.create.useMutation({
    onSuccess: async () => {
      setMessage("新しい配送を追加しました");
      setError(null);
      setForm((prev) => ({ ...prev, trackingNumber: "", shippedAt: "", deliveredAt: "", externalRawStatus: "" }));
      await invalidate();
    },
    onError: (err) => {
      setError(err.message);
      setMessage(null);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    createShipment.mutate({
      orderId,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber || undefined,
      status: form.status,
      shippedAt: form.shippedAt ? new Date(form.shippedAt) : undefined,
      deliveredAt: form.deliveredAt ? new Date(form.deliveredAt) : undefined,
      externalRawStatus: form.externalRawStatus || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-3"
    >
      <p className="text-sm font-semibold text-amber-800">配送を追加</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-amber-900">
          配送会社
          <select
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            value={form.carrier}
            onChange={(e) => setForm((prev) => ({ ...prev, carrier: e.target.value }))}
          >
            {carrierOptions.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-amber-900">
          追跡番号
          <input
            type="text"
            value={form.trackingNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="任意"
          />
        </label>

        <label className="space-y-1 text-sm text-amber-900">
          ステータス
          <select
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ShipmentStatus }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-amber-900">
          出荷日時
          <input
            type="datetime-local"
            value={form.shippedAt}
            onChange={(e) => setForm((prev) => ({ ...prev, shippedAt: e.target.value }))}
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>

        <label className="space-y-1 text-sm text-amber-900">
          配達完了日時
          <input
            type="datetime-local"
            value={form.deliveredAt}
            onChange={(e) => setForm((prev) => ({ ...prev, deliveredAt: e.target.value }))}
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>

        <label className="space-y-1 text-sm text-amber-900 sm:col-span-2">
          外部ステータスメモ
          <textarea
            value={form.externalRawStatus}
            onChange={(e) => setForm((prev) => ({ ...prev, externalRawStatus: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="任意"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="submit"
          disabled={createShipment.isPending}
          className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {createShipment.isPending ? "作成中…" : "配送を追加"}
        </button>
        {message && <span className="text-green-700">{message}</span>}
        {error && <span className="text-red-700">{error}</span>}
      </div>
    </form>
  );
}
