import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  });
}

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
    /** Keep soft-nav RSC payloads briefly so sidebar hops feel instant. */
    staleTimes: {
      dynamic: 20,
      static: 120,
    },
  },
  /**
   * Dev-only: allow HMR /_next/* when the tab origin is a LAN IP
   * (e.g. http://192.168.1.10:3000) instead of localhost.
   * Prefer opening http://localhost:3000 — that needs no extra entry.
   * Setting this array switches Next from warn → block for unknown origins.
   */
  allowedDevOrigins: ["127.0.0.1", "192.168.1.10"],
};

export default nextConfig;
