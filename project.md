# プロジェクト概要

LINE ミニアプリ向けのネット書店を想定した Next.js アプリです。Prisma で PostgreSQL のスキーマを管理し、tRPC を通じてフロントエンドからデータアクセスを行います。

## 技術スタック
- Next.js（App Router）
- TypeScript / Tailwind CSS
- Prisma（`prisma/schema.prisma`）と自動生成クライアント（`generated/prisma`）
- tRPC v10（`src/server/api` とクライアントフック `src/trpc/react.ts`）

## ディレクトリ構成
- `src/app/`
  - `page.tsx`：トップページ。本の一覧を Prisma から取得し表示。
  - `cart/`：カートページのスタブ。
  - `profile/`：住所登録・編集 UI。tRPC でユーザー住所 API を呼び出す。
  - `trpc-provider.tsx`：App Router で tRPC クライアントを提供。
  - `layout.tsx` / `globals.css`：レイアウトとグローバルスタイル。
- `src/components/`
  - `Header.tsx`：ヘッダー表示。
  - `bottom-nav.tsx`：モバイル想定のボトムナビゲーション。
- `src/lib/`
  - `prisma.ts`：Prisma クライアント初期化。
  - `cn.ts`：クラス名ユーティリティ。
- `src/server/api/`
  - `trpc.ts`：tRPC コンテキストとヘルパー。
  - `root.ts`：API ルーターのエントリポイント。
  - `routers/book.ts`：書籍データの取得／作成 API。
  - `routers/address.ts`：住所 CRUD と既定住所管理 API。
- `docs/`：ドキュメント（ER 図など）。
- `prisma/`：データベーススキーマ定義。

## データモデル
`docs/erd.md` に ER 図を記載しています。ユーザー・住所・注文・配送などのエンティティとその関連を示します。
