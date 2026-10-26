import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { toggleTaskComplete } from "@/app/actions/workspace";

export default async function MyTasksPage() {
  const { session, org } = await requireOrgContext();

  const tasks = await prisma.task.findMany({
    where: { organizationId: org.id, assigneeId: session.user.id },
    include: {
      memberships: {
        include: { project: true, section: true },
      },
    },
    orderBy: [{ completedAt: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <>
      <h1 className="page-title">My Tasks</h1>
      <p className="page-sub">Everything assigned to you across projects (multi-home aware).</p>
      <div className="card-list">
        {tasks.length === 0 ? <p className="muted">No assignments yet.</p> : null}
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Link href={`/tasks/${task.id}`}>
                <strong style={{ textDecoration: task.completedAt ? "line-through" : "none" }}>
                  {task.title}
                </strong>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await toggleTaskComplete(task.id);
                }}
              >
                <button className="btn btn-ghost" type="submit">
                  {task.completedAt ? "Reopen" : "Complete"}
                </button>
              </form>
            </div>
            <p className="muted">
              {task.memberships
                .map((m) => `${m.project.name} · ${m.section.name}`)
                .join("  ·  ") || "Unhomed"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
