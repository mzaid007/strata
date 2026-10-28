"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const emailPrefill = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res.error) {
        setError(res.error.message ?? "Could not register");
        return;
      }
      if (invite && /^[a-f0-9]{20,}$/i.test(invite)) {
        router.push(`/invite/${invite}`);
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="brand brand-hero" style={{ fontSize: "2.2rem" }}>
          Strata<span>.</span>
        </p>
        <h1 className="page-title" style={{ fontSize: "1.55rem" }}>
          Create account
        </h1>
        <p className="page-sub">
          {invite
            ? "Register with the invited email, then accept the workspace invite."
            : "Email and password only — no SSO in Core."}
        </p>
        {error ? <div className="error">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={emailPrefill}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1.2rem" }}>
          Already have an account?{" "}
          <Link href={invite ? `/login?invite=${encodeURIComponent(invite)}` : "/login"}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-card">
            <p className="muted">Loading…</p>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
