import { cookies as nextCookies } from "next/headers";
import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";

export const ADMIN_COOKIE_NAME = "admin-session";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;
const ADMIN_TOKEN_FALLBACK = "letmein";

if (!process.env.ADMIN_SESSION_PASSWORD) {
  throw new Error("ADMIN_SESSION_PASSWORD is required");
}

const sessionOptions: SessionOptions = {
  password: process.env.ADMIN_SESSION_PASSWORD,
  cookieName: ADMIN_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  },
};

type AdminSession = {
  isAdmin?: true;
  createdAt?: number;
};

const destroyExpiredSession = async (
  session: IronSession<AdminSession>
) => {
  if (!session.isAdmin || !session.createdAt) return null;

  if (Date.now() - session.createdAt > SESSION_DURATION_MS) {
    await session.destroy();
    return null;
  }

  return { isAdmin: true, createdAt: session.createdAt };
};

const getSessionFromCookies = async () => {
  const cookieStore = await nextCookies();
  return getIronSession<AdminSession>(cookieStore, sessionOptions);
};

export const readAdminSession = async () => {
  const session = await getSessionFromCookies();
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

export const getExpectedAdminToken = () => {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.ADMIN_ACCESS_TOKEN) {
      throw new Error("ADMIN_ACCESS_TOKEN is required in production");
    }
  }

  return process.env.ADMIN_ACCESS_TOKEN ?? ADMIN_TOKEN_FALLBACK;
};
