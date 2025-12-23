"use server";

import {
  getExpectedAdminToken,
  persistAdminSession,
  clearAdminSessionCookie,
} from "@/lib/admin";

export async function setAdminSession(token: string) {
  const expected = getExpectedAdminToken();

  if (token !== expected) {
    return { success: false, error: "トークンが一致しません。" } as const;
  }

  await persistAdminSession();
  return { success: true } as const;
}

export async function clearAdminSession() {
  await clearAdminSessionCookie();
}
