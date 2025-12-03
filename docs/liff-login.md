# 📘 LINEミニアプリ（LIFF）ログイン実装ガイド

このドキュメントは、
Next.js（App Router）+ tRPC + Prisma + LINEミニアプリ を前提とした
LIFFログインの手順をわかりやすくまとめたものです。

- なぜログインが必要か
- 必要なLINE Developer設定
- フロント（LIFF）側の実装
- バックエンド側の実装
- JWTによる認証フロー
- シーケンス図
まで一気に理解できます。

## 🚀 1. なぜ LIFF ログインが必要？

ミニアプリでユーザーごとに：

- カート内容
- 注文（Order）
- 配送先住所（UserAddress）
- Stripe支払い
- 購入履歴

を管理するには、
「ユーザーを一意に識別できるID」 が必須。

LINEが提供するID（sub: LINE User ID）を取得し、
backend で User と紐づける → JWT を返す
という流れになります。

## 🧩 2. 必要な LINE Developer Console の設定

1. プロバイダ作成（任意）
2. LINEログインチャネル作成
3. LIFFアプリ作成
4. アクセス許可スコープ設定
  - profile
  - openid
  - email（必要なら）
5. エンドポイントURL設定
  - https://your-domain/liff
  - ローカルは ngrok を推奨
6. チャネルID / チャネルシークレット を取得

## 🧱 3. 全体フロー（シーケンス図）
sequenceDiagram
    participant User as ユーザー
    participant LIFF as フロント（LIFF）
    participant BE as Backend API
    participant DB as DB

    User ->> LIFF: アプリ起動
    LIFF ->> LIFF: liff.init()
    LIFF ->> LIFF: liff.getIDToken()
    LIFF ->> BE: POST /auth/line-login (ID Token)
    BE ->> BE: ID Tokenを検証
    BE ->> BE: sub(=lineUserId)取得
    BE ->> DB: User検索 or 作成
    DB -->> BE: user
    BE ->> LIFF: JWT発行して返却
    LIFF ->> LIFF: localStorageへ保存
    User ->> LIFF: 以後のAPI呼び出し
    LIFF ->> BE: Authorization: Bearer <JWT>
