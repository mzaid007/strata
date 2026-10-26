import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

/** Loopback + RFC1918 — safe to trust in local/dev only. */
function isDevFriendlyOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return true;
    }
    const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
    if (!m) return false;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  } catch {
    return false;
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  /**
   * Prefer `http://localhost:3000` in .env.
   * Dev also trusts the browser Origin when it is loopback/LAN so
   * `http://192.168.x.x:3000` sign-in is not rejected after OPTIONS.
   * Extra origins: comma-separated `BETTER_AUTH_TRUSTED_ORIGINS` (read by Better Auth).
   */
  trustedOrigins: async (request) => {
    const origins = [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter((v): v is string => Boolean(v));

    if (process.env.NODE_ENV !== "production" && request) {
      const origin = request.headers.get("origin");
      if (origin && isDevFriendlyOrigin(origin)) origins.push(origin);
      const host = request.headers.get("host");
      if (host) {
        const proto = request.headers.get("x-forwarded-proto") ?? "http";
        const derived = `${proto}://${host}`;
        if (isDevFriendlyOrigin(derived)) origins.push(derived);
      }
    }

    return [...new Set(origins)];
  },
});

export type Session = typeof auth.$Infer.Session;
