import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
