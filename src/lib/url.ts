export const getBaseUrl = (req?: Request) => {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_URL;

  if (envUrl) {
    const normalized = envUrl.startsWith("http")
      ? envUrl
      : `https://${envUrl}`;
    return normalized.replace(/\/$/, "");
  }

  const host = req?.headers.get("host") ?? "localhost:3000";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = isLocalhost ? "http" : "https";

  return `${protocol}://${host}`.replace(/\/$/, "");
};
