import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";

export default async function HomePage() {
  const { session, org } = await requireOrgContext();

  const [projects, myOpen, unread, goals] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: org.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, description: true, color: true },
    }),
    prisma.task.count({
      where: {
        organizationId: org.id,
        assigneeId: session.user.id,
        completedAt: null,
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    prisma.goal.findMany({
      where: { organizationId: org.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, progress: true, status: true },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Home</h1>
      <p className="page-sub">
        {org.name} — {myOpen} open task{myOpen === 1 ? "" : "s"} assigned to you
        {unread ? ` · ${unread} unread in Inbox` : " · Inbox clear"}.
      </p>

      <div className="jump-panel">
        <div>
          <strong>Jump in</strong>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Tasks, calendar, goals, or a project board.
          </p>
        </div>
        <div className="row">
          <Link className="btn" href="/my-tasks">
            My Tasks
          </Link>
          <Link className="btn btn-ghost" href="/calendar">
            Calendar
          </Link>
          <Link className="btn btn-ghost" href="/inbox">
            Inbox{unread ? ` (${unread})` : ""}
          </Link>
        </div>
      </div>

      <section className="card-list">
        {goals.length > 0 ? (
          <>
            <h2 className="section-title">Goals</h2>
            {goals.map((g) => (
              <Link key={g.id} href="/goals" className="list-row">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{g.title}</strong>
                  <span className="badge">{g.progress}%</span>
                </div>
              </Link>
            ))}
          </>
        ) : null}

        <h2 className="section-title">Projects</h2>
        {projects.length === 0 ? (
          <p className="muted">
            No projects yet. <Link href="/projects">Create one</Link>.
          </p>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="list-row">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{p.name}</strong>
                <span className="badge" style={{ background: `${p.color}22`, color: p.color }}>
                  open
                </span>
              </div>
              {p.description ? <p className="muted">{p.description}</p> : null}
            </Link>
          ))
        )}
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <Link className="btn btn-ghost" href="/projects">
            All projects
          </Link>
          <Link className="btn btn-ghost" href="/portfolios">
            Portfolios
          </Link>
          <Link className="btn btn-ghost" href="/workload">
            Workload
          </Link>
        </div>
      </section>
    </>
  );
}
