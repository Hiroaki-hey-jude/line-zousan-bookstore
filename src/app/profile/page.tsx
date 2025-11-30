"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { trpc } from "@/trpc/react";

/* -----------------------------
   型定義
------------------------------ */

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

type Address = RouterOutputs["userAddress"]["list"][number];
type AddressMutationInput = RouterInputs["userAddress"]["create"];
type Order = RouterOutputs["order"]["list"][number];

// isDefault 以外は全て string と明確化
type AddressForm = {
  label: string;
  recipientName: string;
  postalCode: string;
  prefecture: string;
  city: string;
  townName: string;
  chome: string;
  houseNumber: string;
  building: string;
  phone: string;
  isDefault: boolean;
};

/* -----------------------------
   初期フォーム値
------------------------------ */

const createEmptyForm = (): AddressForm => ({
  label: "",
  recipientName: "",
  postalCode: "",
  prefecture: "",
  city: "",
  townName: "",
  chome: "",
  houseNumber: "",
  building: "",
  phone: "",
  isDefault: false,
});

/* -----------------------------
   バリデーションに必要な項目
------------------------------ */

const requiredFields: Array<keyof AddressForm> = [
  "label",
  "recipientName",
  "postalCode",
  "prefecture",
  "city",
  "townName",
  "houseNumber",
  "phone",
];

/* -----------------------------
   optional項目の正規化
------------------------------ */
const normalizeOptionalField = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/* -----------------------------
   tRPC の mutation payload 生成
------------------------------ */
const buildMutationPayload = (form: AddressForm): AddressMutationInput => ({
  label: form.label.trim(),
  recipientName: form.recipientName.trim(),
  postalCode: form.postalCode.trim(),
  prefecture: form.prefecture.trim(),
  city: form.city.trim(),
  townName: form.townName.trim(),
  chome: normalizeOptionalField(form.chome),
  houseNumber: form.houseNumber.trim(),
  building: normalizeOptionalField(form.building),
  phone: form.phone.trim(),
  isDefault: form.isDefault,
});

/* -----------------------------
   エラーメッセージ整形
------------------------------ */
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  });

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const statusStyle = (status: Order["status"]) => {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
  }
};

/* -----------------------------
   メインコンポーネント
------------------------------ */

export default function ProfilePage() {
  const utils = trpc.useUtils();

  const profileQuery = trpc.user.profile.useQuery();
  const addressesQuery = trpc.userAddress.list.useQuery();
  const ordersQuery = trpc.order.list.useQuery();
  const createMutation = trpc.userAddress.create.useMutation();
  const updateMutation = trpc.userAddress.update.useMutation();
  const deleteMutation = trpc.userAddress.remove.useMutation();
  const setDefaultMutation = trpc.userAddress.setDefault.useMutation();

  const profile = profileQuery.data;
  const addresses = useMemo(
    () => addressesQuery.data ?? [],
    [addressesQuery.data],
  );
  const orders = ordersQuery.data ?? [];

  const [formData, setFormData] = useState<AddressForm>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const editingTarget = useMemo(
    () => addresses.find((address) => address.id === editingId),
    [addresses, editingId],
  );

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditingId(null);
  };

  const invalidateAddresses = async () => {
    await utils.userAddress.list.invalidate();
  };

  /* -----------------------------
     input共通ハンドラ（string/boolean）
  ------------------------------ */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.name as keyof AddressForm;

    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* -----------------------------
    新規作成 / 更新 submit
  ------------------------------ */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const missing = requiredFields.filter((field) => {
      const val = formData[field];
      return typeof val === "string" ? val.trim() === "" : false;
    });
    if (missing.length > 0) {
      setErrorMessage("必須項目を入力してください。");
      return;
    }

    const payload = buildMutationPayload(formData);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        setStatusMessage("住所を更新しました。");
      } else {
        await createMutation.mutateAsync(payload);
        setStatusMessage("新しい住所を登録しました。");
      }

      await invalidateAddresses();
      resetForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "住所の保存に失敗しました。"));
    }
  };

  /* -----------------------------
    編集開始
  ------------------------------ */
  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label ?? "",
      recipientName: address.recipientName,
      postalCode: address.postalCode,
      prefecture: address.prefecture,
      city: address.city,
      townName: address.townName,
      chome: address.chome ?? "",
      houseNumber: address.houseNumber ?? "",
      building: address.building ?? "",
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  /* -----------------------------
    削除
  ------------------------------ */
  const handleDelete = async (id: string) => {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await deleteMutation.mutateAsync({ id });
      await invalidateAddresses();

      if (editingId === id) resetForm();

      setStatusMessage("住所を削除しました。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "住所の削除に失敗しました。"));
    }
  };

  /* -----------------------------
    既定に設定
  ------------------------------ */
  const handleSetDefault = async (id: string) => {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await setDefaultMutation.mutateAsync({ id });
      await invalidateAddresses();
      setStatusMessage("既定の住所を更新しました。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "既定の住所の設定に失敗しました。"));
    }
  };

  /* -----------------------------
    状態フラグ
  ------------------------------ */

  const isEditing = Boolean(editingId);
  const isLoadingAddresses = addressesQuery.isLoading;
  const addressCount = addresses.length;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    setDefaultMutation.isPending;

  const avatarInitial = profile?.name?.charAt(0) ?? "L";

  /* -----------------------------
    JSX
  ------------------------------ */

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-sm text-gray-600">
          LINEログイン中のアカウント情報、配送先、注文履歴をまとめて確認できます。
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-lg font-bold text-black shadow-inner">
                {avatarInitial}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">LINEアカウント</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profileQuery.isLoading ? "読み込み中..." : profile?.name ?? "ゲスト"}
                </p>
                <p className="text-sm text-gray-600">
                  {profile?.email ?? "メールアドレス未設定"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  配送先
                </p>
                <p className="text-base font-semibold text-gray-900">{addressCount} 件</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  注文履歴
                </p>
                <p className="text-base font-semibold text-gray-900">{orders.length} 件</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">ヘルプとポリシー</h2>
          <p className="mt-1 text-xs text-gray-600">
            ご利用にあたっての重要なリンクをまとめています。
          </p>
          <div className="mt-3 space-y-2 text-sm font-semibold text-yellow-700">
            <Link className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 hover:bg-yellow-100" href="/terms">
              利用規約
              <span aria-hidden>→</span>
            </Link>
            <Link className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 hover:bg-yellow-100" href="/privacy">
              プライバシーポリシー
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">登録済みの住所</h2>
              <p className="text-xs text-gray-500">
                タップで編集や既定の切り替えが可能です。
              </p>
            </div>
            <span className="text-xs text-gray-500">{addressCount} 件</span>
          </header>

          {isLoadingAddresses ? (
            <p className="text-sm text-gray-500">住所を読み込み中です…</p>
          ) : addressesQuery.error ? (
            <p className="text-sm text-red-600">
              住所の取得に失敗しました：{addressesQuery.error.message}
            </p>
          ) : addressCount === 0 ? (
            <p className="text-sm text-gray-500">まだ住所が登録されていません。</p>
          ) : (
            <ul className="space-y-3">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {address.label ?? "配送先"}
                      </p>
                      <p className="text-xs text-gray-500">{address.recipientName}</p>
                    </div>

                    {address.isDefault && (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                        既定
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <p>〒 {address.postalCode}</p>
                    <p>
                      {address.prefecture}
                      {address.city}
                      {address.townName}
                      {address.chome ?? ""}
                      {address.houseNumber ?? ""}
                    </p>
                    {address.building && <p>{address.building}</p>}

                    <p className="mt-1 text-xs text-gray-500">TEL: {address.phone}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleEdit(address)}
                      disabled={isMutating}
                      className="rounded-lg border border-gray-300 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      編集
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={isMutating}
                        className="rounded-lg border border-green-600 px-3 py-1 font-semibold text-green-600 hover:bg-green-50"
                      >
                        既定にする
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      disabled={isMutating}
                      className="rounded-lg border border-red-500 px-3 py-1 font-semibold text-red-500 hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* -----------------------------
           住所入力フォーム
        ------------------------------ */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing
              ? `「${editingTarget?.label ?? ""}」を編集中`
              : "新しい住所を登録"}
          </h2>
          <p className="text-xs text-gray-500">郵便番号と市区町村は必須です。</p>

          {statusMessage && (
            <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {statusMessage}
            </p>
          )}
          {errorMessage && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            {/* ラベルと受取人 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="label"
                label="ラベル"
                required
                value={formData.label}
                onChange={handleInputChange}
              />

              <Input
                id="recipientName"
                label="受取人"
                required
                value={formData.recipientName}
                onChange={handleInputChange}
              />
            </div>

            {/* 郵便番号・都道府県・市区町村 */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                id="postalCode"
                label="郵便番号"
                required
                value={formData.postalCode}
                onChange={handleInputChange}
              />

              <Input
                id="prefecture"
                label="都道府県"
                required
                value={formData.prefecture}
                onChange={handleInputChange}
              />

              <Input
                id="city"
                label="市区町村"
                required
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            {/* 町名・丁目・番地 */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                id="townName"
                label="町名"
                required
                value={formData.townName}
                onChange={handleInputChange}
              />

              <Input
                id="chome"
                label="丁目（任意）"
                value={formData.chome}
                onChange={handleInputChange}
              />

              <Input
                id="houseNumber"
                label="番地・番号"
                required
                value={formData.houseNumber}
                onChange={handleInputChange}
              />
            </div>

            <Input
              id="building"
              label="建物名・部屋番号（任意）"
              value={formData.building}
              onChange={handleInputChange}
            />

            <Input
              id="phone"
              label="電話番号"
              required
              value={formData.phone}
              onChange={handleInputChange}
            />

            {/* checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              既定の配送先として設定する
            </label>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={isMutating}
                className="flex-1 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 disabled:bg-gray-200 sm:flex-none"
              >
                {isEditing ? "住所を更新" : "住所を登録"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={isMutating}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {isEditing ? "編集をキャンセル" : "入力をクリア"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">注文履歴</h2>
            <p className="text-xs text-gray-500">過去の注文を確認できます。</p>
          </div>
          <span className="text-xs text-gray-500">{orders.length} 件</span>
        </div>

        {ordersQuery.isLoading ? (
          <p className="mt-3 text-sm text-gray-500">注文履歴を読み込み中です…</p>
        ) : ordersQuery.error ? (
          <p className="mt-3 text-sm text-red-600">
            注文履歴の取得に失敗しました：{ordersQuery.error.message}
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">まだ注文はありません。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <th className="px-4 py-3">注文ID</th>
                  <th className="px-4 py-3">注文日</th>
                  <th className="px-4 py-3">合計金額</th>
                  <th className="px-4 py-3">ステータス</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-xs font-semibold text-yellow-700 underline underline-offset-4 hover:text-yellow-800"
                      >
                        注文詳細ページへ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------
   汎用 Input コンポーネント（型安全）
------------------------------------------- */
function Input({
  id,
  label,
  required,
  value,
  onChange,
}: {
  id: keyof AddressForm;
  label: string;
  value: string;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
      />
    </div>
  );
}
