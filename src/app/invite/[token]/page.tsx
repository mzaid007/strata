import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invite) notFound();

  const expired = invite.expiresAt.getTime() < Date.now();
  const accepted = Boolean(invite.acceptedAt);
  const session = await getSessionUser();

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title" style={{ fontSize: "2rem" }}>
          Workspace invite
        </h1>
        <p className="page-sub">
          {invite.invitedBy.name} invited <strong>{invite.email}</strong> to{" "}
          <strong>{invite.organization.name}</strong>.
        </p>

        {accepted ? (
          <p className="muted">This invite was already accepted.</p>
        ) : expired ? (
          <p className="error">This invite has expired. Ask an admin for a new one.</p>
        ) : session ? (
          session.email.trim().toLowerCase() === invite.email.toLowerCase() ? (
            <AcceptInviteButton token={token} />
          ) : (
            <div>
              <p className="error">
                You are signed in as {session.email}. Sign in as {invite.email} to accept.
              </p>
              <Link className="btn btn-ghost" href="/login">
                Switch account
              </Link>
            </div>
          )
        ) : (
          <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              className="btn"
              href={`/register?email=${encodeURIComponent(invite.email)}&invite=${encodeURIComponent(token)}`}
            >
              Register to accept
            </Link>
            <Link
              className="btn btn-ghost"
              href={`/login?invite=${encodeURIComponent(token)}`}
            >
              Sign in
            </Link>
          </div>
        )}

        <p className="muted" style={{ marginTop: "1.2rem" }}>
          <Link href="/">Back to Strata</Link>
        </p>
      </div>
    </div>
  );
}
