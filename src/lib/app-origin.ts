/**
 * Public app origin for Better Auth, OpenRouter referer, etc.
 *
 * Precedence for the optional `explicit` override (caller passes
 * BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL):
 * 1. `explicit` if set (custom domain / local .env)
 * 2. `https://${VERCEL_URL}` when Vercel injects VERCEL_URL (no protocol in raw var)
 * 3. `http://localhost:3000` for local
 */
export function getAppOrigin(explicit?: string | null): string {
  const trimmed = explicit?.trim().replace(/\/$/, "");
  if (trimmed) return trimmed;

  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) {
    if (vercel.startsWith("http://") || vercel.startsWith("https://")) return vercel;
    return `https://${vercel}`;
  }

  return "http://localhost:3000";
}
