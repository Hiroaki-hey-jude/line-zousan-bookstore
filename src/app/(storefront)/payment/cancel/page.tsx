import Link from "next/link";

type CancelPageProps = {
  searchParams?: {
    orderId?: string;
  };
};

export default function PaymentCancelPage({ searchParams }: CancelPageProps) {
  const orderId = searchParams?.orderId;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <span className="text-sm font-semibold text-yellow-600">Payment canceled</span>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          決済がキャンセルされました
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Stripe のチェックアウトページでキャンセルされたため、お支払いは完了していません。再度購入したい場合はカートページに戻り、決済をやり直してください。
        </p>

        {orderId && (
          <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
            <p className="text-xs text-gray-500">注文ID</p>
            <p className="font-mono text-base">{orderId}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cart"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            カートに戻る
          </Link>
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
