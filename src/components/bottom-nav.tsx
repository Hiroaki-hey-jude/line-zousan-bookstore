"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/profile", label: "プロフィール", icon: "person" },
  { href: "/cart", label: "カート", icon: "shopping_cart" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur z-50 shadow-sm">
      <ul className="flex">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-xs",
                  active ? "text-blue-600 font-semibold" : "text-gray-500",
                )}
              >
                {/* ★ Material Icons に変更 */}
                <span className="material-icons text-2xl">
                  {tab.icon}
                </span>

                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
