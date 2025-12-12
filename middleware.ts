import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readAdminSession } from "@/lib/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const bypassPaths = ["/admin/login", "/admin/unauthorized"];
    const isBypassed = bypassPaths.some((path) => pathname.startsWith(path));

    if (!isBypassed) {
      const session = await readAdminSession(request);

      if (!session) {
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
