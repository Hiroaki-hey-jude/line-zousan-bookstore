import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/lib/admin";

const ADMIN_TOKEN_FALLBACK = "letmein";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const bypassPaths = ["/admin/login", "/admin/unauthorized"];
    const isBypassed = bypassPaths.some((path) => pathname.startsWith(path));

    if (!isBypassed) {
      const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
      const expected = process.env.ADMIN_ACCESS_TOKEN ?? ADMIN_TOKEN_FALLBACK;

      if (!adminToken || adminToken !== expected) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
