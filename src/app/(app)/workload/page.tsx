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
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  const weekStart = new Date(today.getTime() - 7 * 86400000);

  const dueSoon = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId: org.id,
      completedAt: null,
      assigneeId: { not: null },
      dueOn: { gte: today, lte: weekEnd },
    },
    _count: { _all: true },
  });

  const overdue = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId: org.id,
      completedAt: null,
      assigneeId: { not: null },
      dueOn: { lt: today },
    },
    _count: { _all: true },
  });

  const completedRecently = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId: org.id,
      assigneeId: { not: null },
      completedAt: { gte: weekStart },
    },
    _count: { _all: true },
  });

  const openMap = new Map(openTasks.map((r) => [r.assigneeId!, r._count._all]));
  const dueMap = new Map(dueSoon.map((r) => [r.assigneeId!, r._count._all]));
  const overdueMap = new Map(overdue.map((r) => [r.assigneeId!, r._count._all]));
  const doneMap = new Map(completedRecently.map((r) => [r.assigneeId!, r._count._all]));

  function loadScore(userId: string) {
    const open = openMap.get(userId) ?? 0;
    const soon = dueMap.get(userId) ?? 0;
    const late = overdueMap.get(userId) ?? 0;
    return open + soon + late * 2;
  }

  const maxLoad = Math.max(1, ...members.map((m) => loadScore(m.user.id)));

  const unassigned = await prisma.task.count({
    where: { organizationId: org.id, completedAt: null, assigneeId: null },
  });

  const totalOverdue = [...overdueMap.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <h1 className="page-title">Workload</h1>
      <p className="page-sub">
        Load blends open work, due-soon, and overdue (overdue counts double) — still not hours
        capacity.
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <strong>Dashboard</strong>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          {openMap.size} people with open work · {unassigned} unassigned · {totalOverdue} overdue
        </p>
      </div>

      <div className="workload-grid">
        {members.map((m) => {
          const open = openMap.get(m.user.id) ?? 0;
          const soon = dueMap.get(m.user.id) ?? 0;
          const late = overdueMap.get(m.user.id) ?? 0;
          const done = doneMap.get(m.user.id) ?? 0;
          const load = loadScore(m.user.id);
          const heat =
            load / maxLoad >= 0.75 ? "high" : load / maxLoad >= 0.4 ? "mid" : "low";
          return (
            <div key={m.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{m.user.name}</strong>
                  <p className="muted" style={{ margin: 0 }}>
                    {m.user.email}
                  </p>
                </div>
                <span className={`badge badge-load-${heat}`}>load {load}</span>
              </div>
              <div className="workload-bar-bg" style={{ marginTop: "0.65rem" }}>
                <div
                  className={`workload-bar-fill workload-bar-fill-${heat}`}
                  style={{ width: `${Math.round((load / maxLoad) * 100)}%` }}
                />
              </div>
              <p className="muted" style={{ marginTop: "0.45rem" }}>
                {open} open · {soon} due in 7d · {late} overdue · {done} done (7d)
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
