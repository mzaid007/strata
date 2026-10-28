import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title">Not found</h1>
        <p className="page-sub">That page or record does not exist, or you no longer have access.</p>
        <Link className="btn" href="/home">
          Go home
        </Link>
      </div>
    </div>
  );
}
