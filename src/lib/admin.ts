import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  getIronSession,
  type IronSession,
  type IronSessionOptions,
} from "iron-session";
import { getIronSession as getEdgeIronSession } from "iron-session/edge";

export const ADMIN_COOKIE_NAME = "admin-session";

const ADMIN_TOKEN_FALLBACK = "letmein";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

const sessionPassword =
  process.env.ADMIN_SESSION_PASSWORD ??
  "dev-change-me-admin-session-password-32-chars";

export type AdminSessionPayload = {
  isAdmin: true;
  createdAt: number;
};

type AdminSession = Partial<AdminSessionPayload>;

const sessionOptions: IronSessionOptions = {
  password: sessionPassword,
  cookieName: ADMIN_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  },
};

const destroyExpiredSession = async (
  session: IronSession<AdminSession>
): Promise<AdminSessionPayload | null> => {
  if (!session.isAdmin || !session.createdAt) return null;

  const isExpired = Date.now() - session.createdAt > SESSION_DURATION_MS;
  if (isExpired) {
    await session.destroy();
    return null;
  }

  return { isAdmin: true, createdAt: session.createdAt };
};

const getSessionFromCookies = () =>
  getIronSession<AdminSession>(nextCookies(), sessionOptions);

const getSessionFromRequest = (request: NextRequest | Request) =>
  getEdgeIronSession<AdminSession>(request, sessionOptions);

export const readAdminSession = async (
  request?: NextRequest | Request
): Promise<AdminSessionPayload | null> => {
  const session = request
    ? await getSessionFromRequest(request)
    : await getSessionFromCookies();

  return destroyExpiredSession(session);
};

export const persistAdminSession = async () => {
  const session = await getSessionFromCookies();
  session.isAdmin = true;
  session.createdAt = Date.now();
  await session.save();
};

export const clearAdminSessionCookie = async () => {
  const session = await getSessionFromCookies();
  await session.destroy();
};

export const getExpectedAdminToken = () =>
  process.env.ADMIN_ACCESS_TOKEN ?? ADMIN_TOKEN_FALLBACK;
