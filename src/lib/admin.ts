import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";

type CryptoLike = Crypto;

export const ADMIN_COOKIE_NAME = "admin-session";

const ADMIN_TOKEN_FALLBACK = "letmein";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;
const SALT = "zousan-admin-session";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const sessionPassword = (
  process.env.ADMIN_SESSION_PASSWORD ??
  "dev-change-me-admin-session-password-32-chars"
).padEnd(32, "!");

export type AdminSessionPayload = {
  isAdmin: true;
  createdAt: number;
};

const base64UrlEncode = (bytes: ArrayBuffer): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  let binary = "";
  const array = new Uint8Array(bytes);
  array.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlDecode = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getCrypto = async (): Promise<CryptoLike> => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return crypto as CryptoLike;
  }

  const { webcrypto } = await import("crypto");
  return webcrypto as unknown as CryptoLike;
};

const deriveKey = async () => {
  const cryptoObj = await getCrypto();
  const keyMaterial = await cryptoObj.subtle.importKey(
    "raw",
    encoder.encode(sessionPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 200_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const sealSession = async (payload: AdminSessionPayload): Promise<string> => {
  const cryptoObj = await getCrypto();
  const key = await deriveKey();
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(JSON.stringify(payload));
  const encrypted = await cryptoObj.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return base64UrlEncode(combined.buffer);
};

const unsealSession = async (value: string | undefined | null): Promise<AdminSessionPayload | null> => {
  if (!value) return null;

  try {
    const cryptoObj = await getCrypto();
    const bytes = base64UrlDecode(value);
    if (bytes.byteLength <= 12) return null;

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const key = await deriveKey();

    const decrypted = await cryptoObj.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const parsed = JSON.parse(decoder.decode(decrypted));

    if (parsed?.isAdmin === true) {
      return { isAdmin: true, createdAt: Number(parsed.createdAt) || Date.now() };
    }

    return null;
  } catch {
    return null;
  }
};

const cookieIsExpired = (session: AdminSessionPayload) => {
  return Date.now() - session.createdAt > SESSION_DURATION_MS;
};

const getCookieValue = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${ADMIN_COOKIE_NAME}=`)) {
      return decodeURIComponent(part.slice(ADMIN_COOKIE_NAME.length + 1));
    }
  }

  return null;
};

export const readAdminSession = async (
  request: NextRequest | Request
): Promise<AdminSessionPayload | null> => {
  const value = "cookies" in request && typeof request.cookies.get === "function"
    ? request.cookies.get(ADMIN_COOKIE_NAME)?.value
    : getCookieValue(request.headers.get("cookie"));

  const session = await unsealSession(value);
  if (!session) return null;
  if (cookieIsExpired(session)) return null;
  return session;
};

export const persistAdminSession = async () => {
  const sealed = await sealSession({ isAdmin: true, createdAt: Date.now() });

  nextCookies().set(ADMIN_COOKIE_NAME, sealed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
};

export const clearAdminSessionCookie = () => {
  nextCookies().delete(ADMIN_COOKIE_NAME);
};

export const getExpectedAdminToken = () => process.env.ADMIN_ACCESS_TOKEN ?? ADMIN_TOKEN_FALLBACK;
