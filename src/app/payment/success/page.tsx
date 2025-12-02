import Link from "next/link";

type SuccessPageProps = {
  searchParams?: {
    orderId?: string;
  };
};

export default function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const orderId = searchParams?.orderId;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <span className="text-sm font-semibold text-green-600">Thank you!</span>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          決済が完了しました
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          決済の完了通知を受け取り次第、注文ステータスを更新します。数秒待っても反映されない場合は、プロフィールの注文履歴からステータスを再確認してください。
        </p>

        {orderId && (
          <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
            <p className="text-xs text-gray-500">注文ID</p>
            <p className="font-mono text-base">{orderId}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              注文詳細を確認
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            プロフィールに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
