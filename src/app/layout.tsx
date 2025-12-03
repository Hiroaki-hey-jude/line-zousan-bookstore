// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/Header";
import { TRPCProvider } from "./trpc-provider";
// import LiffProvider from "../components/LiffProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* ★ Material Icons 読み込み */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-gray-50">
        {/* ★ すべての UI の外側に置く */}
        {/* <LiffProvider> */}
          <TRPCProvider>
            <Header />
            <main className="pb-16">{children}</main>
            <BottomNav />
          </TRPCProvider>
        {/* </LiffProvider> */}
      </body>
    </html>
  );
}
