// // app/layout.tsx
// import type { ReactNode } from "react";
// import "./globals.css";
// import { TRPCProvider } from "./trpc-provider";

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="ja">
//       <body>
//         <TRPCProvider>{children}</TRPCProvider>
//       </body>
//     </html>
//   );
// }

import type { ReactNode } from "react";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/Header";
import { TRPCProvider } from "./trpc-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* ★ Material Icons 読み込み ここだけ追加 */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-gray-50">
        <TRPCProvider>
          {/* ヘッダー */}
          <Header />

          {/* コンテンツ（下ナビの分だけ下に余白） */}
          <main className="pb-16">{children}</main>

          {/* 下ナビ */}
          <BottomNav />
        </TRPCProvider>
      </body>
    </html>
  );
}
