"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** Same-origin path only — `//host` and `/\host` would redirect off-site. */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/home";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/home";
  if (/[\u0000-\u001f\u007f]/.test(raw)) return "/home";
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? "Could not sign in");
        return;
      }
      router.push(safeNextPath(searchParams.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title" style={{ fontSize: "2rem" }}>
          Strata
        </h1>
        <p className="page-sub">Sign in to your workspace.</p>
        {error ? <div className="error">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1.2rem" }}>
          No account? <Link href="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
