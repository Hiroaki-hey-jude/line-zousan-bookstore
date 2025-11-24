"use client";

import { useMemo, useState } from "react";

type Address = {
  id: string;
  label: string;
  recipientName: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  isDefault: boolean;
};

type AddressForm = Omit<Address, "id">;

const initialAddresses: Address[] = [];

const createEmptyForm = (): AddressForm => ({
  label: "",
  recipientName: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  isDefault: false,
});

const requiredFields: Array<keyof AddressForm> = [
  "label",
  "recipientName",
  "postalCode",
  "prefecture",
  "city",
  "addressLine1",
  "phone",
];

export default function ProfilePage() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [formData, setFormData] = useState<AddressForm>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const editingTarget = useMemo(
    () => addresses.find((address) => address.id === editingId),
    [addresses, editingId],
  );

  const markDefault = (items: Address[], targetId: string) =>
    items.map((address) => ({
      ...address,
      isDefault: address.id === targetId,
    }));

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.name as keyof AddressForm;
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;

    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const missing = requiredFields.filter((field) => {
      const value = formData[field];
      return typeof value === "string" ? value.trim() === "" : false;
    });

    if (missing.length > 0) {
      setErrorMessage("必須項目を入力してください。");
      return;
    }

    if (editingId) {
      let updated = addresses.map((address) =>
        address.id === editingId ? { ...address, ...formData } : address,
      );

      if (formData.isDefault) {
        updated = markDefault(updated, editingId);
      } else if (updated.length > 0 && !updated.some((address) => address.isDefault)) {
        updated = markDefault(updated, updated[0].id);
      }

      setAddresses(updated);
      setStatusMessage("住所情報を更新しました。");
    } else {
      const newId = `addr-${Date.now()}`;
      const shouldBeDefault =
        formData.isDefault || addresses.every((address) => !address.isDefault);
      let updated = [
        ...addresses,
        { id: newId, ...formData, isDefault: shouldBeDefault },
      ];

      if (shouldBeDefault) {
        updated = markDefault(updated, newId);
      }

      setAddresses(updated);
      setStatusMessage("新しい住所を登録しました。");
    }

    resetForm();
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      recipientName: address.recipientName,
      postalCode: address.postalCode,
      prefecture: address.prefecture,
      city: address.city,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => {
      const filtered = prev.filter((address) => address.id !== id);
      if (filtered.length === 0) {
        return filtered;
      }
      const hasDefault = filtered.some((address) => address.isDefault);
      if (!hasDefault) {
        return filtered.map((address, index) => ({
          ...address,
          isDefault: index === 0,
        }));
      }
      return filtered;
    });

    if (editingId === id) {
      resetForm();
    }

    setStatusMessage("住所を削除しました。");
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) => markDefault(prev, id));
    setStatusMessage("既定の住所を更新しました。");
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-4">
      <section className="space-y-2">
        <h1 className="text-lg font-semibold text-gray-900">プロフィール</h1>
        <p className="text-sm text-gray-600">
          LINEログイン中のアカウントに紐づく配送先を管理できます。既定の住所は注文時に
          自動で入力されます。
        </p>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">登録済みの住所</h2>
            <p className="text-xs text-gray-500">タップで編集や既定の切り替えが可能です。</p>
          </div>
          <span className="text-xs text-gray-500">{addresses.length} 件</span>
        </header>

        {addresses.length === 0 ? (
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
                      {address.label}
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
                    {address.addressLine1}
                  </p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p className="mt-1 text-xs text-gray-500">TEL: {address.phone}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleEdit(address)}
                    className="rounded-lg border border-gray-300 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    編集
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                      className="rounded-lg border border-green-600 px-3 py-1 font-semibold text-green-600 hover:bg-green-50"
                    >
                      既定にする
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    className="rounded-lg border border-red-500 px-3 py-1 font-semibold text-red-500 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {isEditing
            ? `「${editingTarget?.label ?? ""}」を編集中`
            : "新しい住所を登録"}
        </h2>
        <p className="text-xs text-gray-500">
          郵便番号と市区町村は必須です。番地・建物名まで入力すると配送トラブルを防げます。
        </p>

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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700" htmlFor="label">
                ラベル<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="label"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="自宅 / 勤務先 など"
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-xs font-medium text-gray-700"
                htmlFor="recipientName"
              >
                受取人<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="像倉 花子"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-gray-700"
                htmlFor="postalCode"
              >
                郵便番号<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="postalCode"
                name="postalCode"
                inputMode="numeric"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="160-0000"
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-xs font-medium text-gray-700"
                htmlFor="prefecture"
              >
                都道府県<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="prefecture"
                name="prefecture"
                value={formData.prefecture}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="東京都"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700" htmlFor="city">
                市区町村<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                placeholder="渋谷区神宮前"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-medium text-gray-700"
              htmlFor="addressLine1"
            >
              番地・番号<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              placeholder="1-2-3"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-medium text-gray-700"
              htmlFor="addressLine2"
            >
              建物名・部屋番号（任意）
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              placeholder="サンプルマンション 101"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700" htmlFor="phone">
              電話番号<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              placeholder="090-1234-5678"
            />
          </div>

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
              className="flex-1 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 disabled:bg-gray-200 sm:flex-none"
            >
              {isEditing ? "住所を更新" : "住所を登録"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? "編集をキャンセル" : "入力をクリア"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
