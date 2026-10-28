import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";

export default async function WorkloadPage() {
  const { org } = await requireOrgContext();

  const members = await prisma.orgMembership.findMany({
    where: { organizationId: org.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const openTasks = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: { organizationId: org.id, completedAt: null, assigneeId: { not: null } },
    _count: { _all: true },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dueSoon = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId: org.id,
      completedAt: null,
      assigneeId: { not: null },
      dueOn: {
        gte: today,
        lte: new Date(Date.now() + 7 * 86400000),
      },
    },
    _count: { _all: true },
  });

  const openMap = new Map(openTasks.map((r) => [r.assigneeId!, r._count._all]));
  const dueMap = new Map(dueSoon.map((r) => [r.assigneeId!, r._count._all]));
  const maxOpen = Math.max(1, ...openMap.values(), 1);

  const unassigned = await prisma.task.count({
    where: { organizationId: org.id, completedAt: null, assigneeId: null },
  });

  return (
    <>
      <h1 className="page-title">Workload</h1>
      <p className="page-sub">
        Open assignments by person — a light capacity snapshot (not a full capacity planner).
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <strong>Dashboard</strong>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          {openMap.size} people with open work · {unassigned} unassigned open tasks
        </p>
      </div>

      <div className="workload-grid">
        {members.map((m) => {
          const open = openMap.get(m.user.id) ?? 0;
          const soon = dueMap.get(m.user.id) ?? 0;
          return (
            <div key={m.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{m.user.name}</strong>
                  <p className="muted" style={{ margin: 0 }}>
                    {m.user.email}
                  </p>
                </div>
                <span className="badge">{open} open</span>
              </div>
              <div className="workload-bar-bg" style={{ marginTop: "0.65rem" }}>
                <div
                  className="workload-bar-fill"
                  style={{ width: `${Math.round((open / maxOpen) * 100)}%` }}
                />
              </div>
              <p className="muted" style={{ marginTop: "0.45rem" }}>
                {soon} due within 7 days
              </p>
              <Link className="btn btn-ghost" href="/my-tasks" style={{ marginTop: "0.5rem" }}>
                Browse tasks
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
