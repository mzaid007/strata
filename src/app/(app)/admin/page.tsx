import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { InviteMemberForm } from "@/components/InviteMemberForm";

export default async function AdminPage() {
  const { org, membership } = await requireOrgContext();
  const members = await prisma.orgMembership.findMany({
    where: { organizationId: org.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const canInvite = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Thin console for {org.name}. Invite existing registered users by email.
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
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Add member</h2>
          <p className="muted">They must already have a Strata account (register first).</p>
          <InviteMemberForm />
        </section>
      ) : (
        <p className="muted">Only owners/admins can invite.</p>
      )}
    </>
  );
}
