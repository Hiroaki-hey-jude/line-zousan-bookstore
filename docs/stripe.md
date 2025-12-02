# Stripe 決済実装ドキュメント（line-zousan-bookstore）

本書は、Next.js（App Router）+ tRPC + Prisma を使用した  
**Stripe Checkout 決済フローの実装手順と全体設計** をまとめたものです。

LINE ミニアプリからの決済導線にも対応できる構成です。

---

## 🧭 1. 決済フロー概要

Stripe Checkout を使用した基本フローは以下の通り：

1. ユーザーが「購入する」ボタンを押す  
2. フロント → tRPC API に “Checkout Session 作成” を依頼  
3. サーバーが Stripe API を呼び出して `session.url` を取得  
4. フロントが Stripe の Checkout 画面へリダイレクト  
5. 決済完了後、Stripe → Webhook でサーバーに通知  
6. サーバーが DB の注文のステータスを更新

---

## 🎞 2. シーケンス図（Mermaid）

```mermaid
sequenceDiagram
    participant User as User (LINE Mini App)
    participant Frontend as Next.js Frontend
    participant TRPC as tRPC Server
    participant Stripe as Stripe API
    participant Webhook as Webhook Endpoint
    participant DB as Prisma/Database

    User ->> Frontend: 購入ボタンを押す
    Frontend ->> TRPC: createSession(amount, userId)
    TRPC ->> Stripe: Checkout Session 作成
    Stripe -->> TRPC: session.url を返す
    TRPC -->> Frontend: { url: session.url }
    Frontend ->> Stripe: session.url へリダイレクト

    Stripe ->> User: Checkout 画面表示
    Stripe ->> Frontend: success_url / cancel_url に戻す

    Stripe ->> Webhook: checkout.session.completed
    Webhook ->> DB: 支払い成功ステータスに更新
    Webhook -->> Stripe: 200 OK
