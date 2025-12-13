import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/Header";
import { TRPCProvider } from "../trpc-provider";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      <Header />
      <main className="pb-16">{children}</main>
      <BottomNav />
    </TRPCProvider>
  );
}
