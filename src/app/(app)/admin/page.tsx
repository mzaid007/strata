import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { getAppOrigin } from "@/lib/app-origin";
import { InviteMemberForm } from "@/components/InviteMemberForm";

export default async function AdminPage() {
  const { org, membership } = await requireOrgContext();
  const [members, pendingInvites] = await Promise.all([
    prisma.orgMembership.findMany({
      where: { organizationId: org.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orgInvite.findMany({
      where: {
        organizationId: org.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const canInvite = membership.role === "OWNER" || membership.role === "ADMIN";
  const origin = getAppOrigin(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL,
  );

  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Thin console for {org.name}. Invite by email — registered users join immediately; others
        get a shareable link.
      </p>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Members</h2>
        <div className="card-list">
          {members.map((m) => (
            <div key={m.id} className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{m.user.name}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {m.user.email}
                </p>
              </div>
              <span className="badge">{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      {canInvite ? (
        <>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Invite member</h2>
            <InviteMemberForm />
          </section>
          {pendingInvites.length > 0 ? (
            <section className="card">
              <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Pending invites</h2>
              <div className="card-list">
                {pendingInvites.map((inv) => (
                  <div key={inv.id}>
                    <strong>{inv.email}</strong>
                    <p className="muted" style={{ margin: "0.25rem 0 0", wordBreak: "break-all" }}>
                      {origin}/invite/{inv.token}
                    </p>
                    <p className="muted" style={{ margin: "0.2rem 0 0" }}>
                      Expires {inv.expiresAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="muted">Only owners/admins can invite.</p>
      )}
    </>
  );
}
