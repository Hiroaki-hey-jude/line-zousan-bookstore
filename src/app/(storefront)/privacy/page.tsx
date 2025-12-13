import type { Metadata } from "next";

const SERVICE_NAME = "LINEぞうさんブックストア";
const COMPANY_NAME = "株式会社ミチコーポレーション";
const LAST_UPDATED = "2024年7月15日";

type Section = {
  title: string;
  description?: string;
  items: string[];
};

const sections: Section[] = [
  {
    title: "1. 個人情報の定義",
    items: [
      "個人情報とは、生存する個人に関する情報であって、氏名、生年月日、住所、電話番号、メールアドレス、購入履歴、その他特定の個人を識別できるものをいいます。",
      "利用者の端末識別子、Cookie、IPアドレス等も、単独では個人を識別できない場合であっても他情報と照合することで個人を識別できる場合には個人情報として取り扱います。",
    ],
  },
  {
    title: "2. 取得する個人情報",
    items: [
      "会員登録・プロフィール編集時に入力いただく氏名、ニックネーム、メールアドレス、電話番号、配送先住所、性別、生年月日等の登録情報。",
      "注文手続に関する情報（購入商品、支払金額、決済方法、配送先、利用日時等）。",
      "お問い合わせやアンケートに付随して提供いただく内容、サポート履歴。",
      "LINEアカウント連携時に取得するユーザー識別子、表示名、アイコン等（連携設定で許諾いただいた情報に限ります）。",
      "アクセス解析やセキュリティ確保のために取得するCookie、端末情報、利用環境、接続ログ。",
    ],
  },
  {
    title: "3. 利用目的",
    items: [
      "商品発送、決済、サブスクリプション管理等、本サービスの提供・運営に必要な業務の遂行。",
      "本人確認、不正利用防止、トラブル対応、サポート対応のための本人照合および連絡。",
      "サービス改善、新機能開発、広告・キャンペーンの最適化に向けた統計データの作成と分析。",
      "新刊情報、キャンペーン、サービスに関するお知らせのメール配信（利用者が配信停止を希望する場合を除きます）。",
      "法令の定めに基づく権利行使や義務履行、または行政機関の正当な要請への対応。",
    ],
  },
  {
    title: "4. 利用目的の変更",
    items: [
      "当社は、利用者に通知または本サイトに公表することにより、合理的に関連性を有すると認められる範囲で利用目的を変更する場合があります。",
      "利用目的の変更を行う場合は、変更後の目的を速やかに通知または公表します。",
    ],
  },
  {
    title: "5. 第三者提供",
    items: [
      "当社は、あらかじめ利用者の同意を得ることなく、個人情報を第三者に提供しません。ただし、法令に基づく場合、人の生命・身体・財産の保護のために必要な場合等を除きます。",
      "決済事業者、配送業者、データホスティング等、当社の業務委託先に対しては、守秘義務契約に基づき必要な範囲で情報を提供します。",
      "合併・会社分割その他の事由によって事業継承が行われる場合、個人情報を承継先に提供することがあります。この場合、承継先においても本ポリシーと同等の管理を求めます。",
    ],
  },
  {
    title: "6. 個人情報の共同利用",
    items: [
      "本サービスの提供にあたり、当社グループ各社やコラボレーションパートナーと個人情報を共同利用することがあります。",
      "共同利用する項目：会員登録情報、購入履歴、サポート履歴等。",
      "共同利用する者の範囲：LINE公式アカウント運営パートナー、物流・決済連携先など、本サービスの運営に関わる事業者。",
      "利用者情報の管理についての責任者：株式会社ミチコーポレーション。",
    ],
  },
  {
    title: "7. 個人情報の安全管理",
    items: [
      "当社は、個人情報への不正アクセス、紛失、改ざん、漏洩等を防止するため、適切な技術的・組織的安全管理措置を講じます。",
      "社内ではアクセス権限を最小限に限定し、従業員・委託先に対して継続的な教育と監督を実施します。",
      "万が一事故が発生した場合には、速やかに原因究明と再発防止策を講じ、必要に応じて利用者および関係機関へ報告します。",
    ],
  },
  {
    title: "8. Cookie等の利用について",
    items: [
      "当社は、利用者の利便性向上、閲覧履歴の保存、広告配信、アクセス解析のためにCookieや類似技術を使用します。",
      "ブラウザの設定によりCookieの受け入れを拒否することができますが、拒否した場合はサービスの一部機能が利用できないことがあります。",
      "アクセス解析には第三者提供のツールを利用する場合があり、当該第三者がCookieを通じてデータを収集することがあります。",
    ],
  },
  {
    title: "9. 開示・訂正・利用停止等の請求",
    items: [
      "利用者は、当社が保有する自身の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供の停止を求めることができます。",
      "請求は、お問い合わせ窓口より手続きを行ってください。本人確認ができない場合は対応いたしかねます。",
      "法令に基づく保存義務がある情報や、請求内容が合理性に欠ける場合には、全ての請求に応じられないことがあります。",
    ],
  },
  {
    title: "10. 子どもの個人情報",
    items: [
      "18歳未満の利用者が個人情報を提供する場合は、必ず保護者の同意を得た上でお手続きください。",
      "保護者からの申請があった場合には、該当する個人情報の開示や削除に対応することがあります。",
    ],
  },
  {
    title: "11. プライバシーポリシーの改定",
    items: [
      "当社は、必要に応じて本ポリシーの内容を改定します。改定後の内容は本ページへの掲示時点から効力を生じます。",
      "重要な変更がある場合は、アプリ内通知やメール配信等で個別にお知らせすることがあります。",
    ],
  },
  {
    title: "12. お問い合わせ窓口",
    items: [
      "個人情報の取扱いに関するお問い合わせ、各種請求は、本サイトのお問い合わせフォームまたはLINEアプリ内のサポートチャットからご連絡ください。",
      "迅速な対応に努めますが、内容によっては回答までに日数を要する場合があります。緊急のご相談はその旨を明記してください。",
    ],
  },
];

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${SERVICE_NAME}`,
  description: `${COMPANY_NAME}が運営する${SERVICE_NAME}のプライバシーポリシーページです。`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-700">
            Privacy Policy
          </p>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{SERVICE_NAME} プライバシーポリシー</h1>
            <p className="text-sm leading-relaxed text-gray-600">
              本ポリシーは、{COMPANY_NAME}が提供する本サービスにおける個人情報の取扱い方針を定めるものです。
              利用者の皆さまが安心してご利用いただけるよう、取得する情報・利用目的・安全管理体制を明示します。
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-yellow-100 bg-white/80 p-4 text-sm text-gray-700 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                管理会社
              </p>
              <p className="mt-1 font-semibold text-gray-900">{COMPANY_NAME}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                最終更新日
              </p>
              <p className="mt-1 font-semibold text-gray-900">{LAST_UPDATED}</p>
            </div>
          </div>
        </header>

        <section className="space-y-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          {sections.map((section) => (
            <article key={section.title} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                {section.description && (
                  <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                )}
              </div>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
                {section.items.map((item, index) => (
                  <li key={`${section.title}-${index}`} className="flex gap-3">
                    <span className="text-xs font-semibold text-yellow-600">
                      {index + 1}.
                    </span>
                    <p className="flex-1">{item}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <footer className="rounded-3xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-600 sm:px-8">
          <p>
            当社は、利用者の個人情報を適切に保護するため、継続的な見直しと改善を行ってまいります。
            最新情報は本ページでご確認ください。
          </p>
        </footer>
      </div>
    </div>
  );
}
