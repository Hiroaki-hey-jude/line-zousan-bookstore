"use client";

import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import liff from "@line/liff";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/trpc/react";

type TRPCClient = ReturnType<typeof trpc.createClient>;

const createTrpcClient = (sessionToken: string | null): TRPCClient =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/trpc`,
        headers() {
          const headers: Record<string, string> = {};

          if (sessionToken) {
            headers.Authorization = `Bearer ${sessionToken}`;
          }

          return headers;
        },
      }),
    ],
  });

function BaseTRPCProvider({
  children,
  client,
}: {
  children: ReactNode;
  client: TRPCClient;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

type SessionTokenPayload = { exp?: number };
const decodeExpiry = (token: string | null) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const parsed = JSON.parse(atob(payload)) as SessionTokenPayload;
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("sessionToken");
    const exp = decodeExpiry(stored);
    if (!stored || !exp || exp < Date.now()) {
      localStorage.removeItem("sessionToken");
      return null;
    }
    return stored;
  });

  const trpcClient = useMemo(() => createTrpcClient(sessionToken), [sessionToken]);

  // -------------------------------
  // ★ ID Token を verify して期限切れなら login()
  // -------------------------------
  const refreshIdToken = useCallback(async (): Promise<string | null> => {
    await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

    if (!liff.isLoggedIn()) {
      console.log("Not logged in → login()");
      liff.login();
      return null; // リロードされる
    }

    // 初回ログイン以降 ID Token は更新されないため verify が必要
    const idToken = liff.getIDToken();
    console.log(idToken, ' -> idToken')
    if (!idToken) {
      console.warn("ID Token unavailable");
      return null;
    }

    // ID Token を LINE で検証
    const verify = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.NEXT_PUBLIC_LIFF_CHANNEL_ID!, // ★ これ重要
      }),
    }).then((r) => r.json());

    if (verify.error === "invalid_request") {
      console.log("ID Token expired → login() で更新");
      // liff.login(); // 再ログインで新しい ID Token が得られる
      return null;
    }
    return idToken;
  }, []);

  // -------------------------------
  // ★ 初回セッション更新
  // -------------------------------
  const refreshSession = useCallback(async () => {
    const idToken = await refreshIdToken();
    if (!idToken) return;

    const data = await trpcClient.auth.login.mutate({ idToken });

    localStorage.setItem("sessionToken", data.sessionToken);
    setSessionToken(data.sessionToken);
  }, [refreshIdToken, trpcClient]);

  // -------------------------------
  // 初回実行
  // -------------------------------
  useEffect(() => {
    if (sessionToken) return;

    const id = setTimeout(() => {
      refreshSession();
    }, 0);

    return () => clearTimeout(id);
  }, [refreshSession, sessionToken]);

  // -------------------------------
  // sessionToken 自動リフレッシュ
  // -------------------------------
  useEffect(() => {
    if (!sessionToken) return;

    const exp = decodeExpiry(sessionToken);
    if (!exp) return;

    // 5 分前に更新
    const buffer = 5 * 60 * 1000;
    const delay = Math.max(exp - Date.now() - buffer, 0);

    const timer = setTimeout(() => {
      console.log("Session Token refresh...");
      refreshSession();
    }, delay);

    return () => clearTimeout(timer);
  }, [refreshSession, sessionToken]);

  return <BaseTRPCProvider client={trpcClient}>{children}</BaseTRPCProvider>;
}

export function AdminTRPCProvider({ children }: { children: ReactNode }) {
  const trpcClient = useMemo(() => createTrpcClient(null), []);
  return <BaseTRPCProvider client={trpcClient}>{children}</BaseTRPCProvider>;
}
