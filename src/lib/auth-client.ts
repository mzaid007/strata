"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Same-origin `/api/auth` (no absolute baseURL).
 * Forcing `NEXT_PUBLIC_APP_URL=http://localhost:3000` while the page is open at
 * `http://192.168.x.x:3000` made sign-in a cross-origin fetch: OPTIONS 204, POST
 * blocked / origin rejected, and the login UI stuck on “Signing in…”.
 */
export const authClient = createAuthClient();
