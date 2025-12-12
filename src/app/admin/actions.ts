"use server";

import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME } from "@/lib/admin";

const ADMIN_TOKEN_FALLBACK = "letmein";

export async function setAdminSession(token: string) {
  const expected = process.env.ADMIN_ACCESS_TOKEN ?? ADMIN_TOKEN_FALLBACK;

  if (token !== expected) {
    return { success: false, error: "トークンが一致しません。" } as const;
  }

  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return { success: true } as const;
}

export async function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE_NAME);
}
