"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-sub">This page failed to load. Try again, or return home.</p>
        <div className="row">
          <button className="btn" type="button" onClick={reset}>
            Try again
          </button>
          <a className="btn btn-ghost" href="/home">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
