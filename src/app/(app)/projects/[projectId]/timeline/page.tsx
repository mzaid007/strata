import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";
import { addDays, toDateKey } from "@/lib/dates";

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { org } = await requireOrgContext();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  const memberships = await prisma.taskMembership.findMany({
    where: { projectId },
    select: {
      task: {
        select: {
          id: true,
          title: true,
          startOn: true,
          dueOn: true,
          completedAt: true,
        },
      },
    },
    orderBy: { position: "asc" },
    take: 80,
  });

  const tasks = memberships
    .map((m) => m.task)
    .filter((t) => t.dueOn || t.startOn);

  const today = new Date();
  const rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 7));
  const dayCount = 56;
  const days = Array.from({ length: dayCount }, (_, i) => addDays(rangeStart, i));
  const rangeEnd = addDays(rangeStart, dayCount);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  function barStyle(startOn: Date | null, dueOn: Date | null) {
    const start = startOn ?? (dueOn ? addDays(dueOn, -2) : rangeStart);
    const end = dueOn ?? addDays(start, 3);
    const left = Math.max(0, (start.getTime() - rangeStart.getTime()) / totalMs) * 100;
    const right = Math.min(100, (end.getTime() - rangeStart.getTime()) / totalMs) * 100;
    const width = Math.max(2.5, right - left);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">
        Timeline — bars use start/due dates (defaults to a short window before due when start is
        empty).
      </p>
      <ProjectViewTabs projectId={project.id} active="Timeline" />

      <div className="timeline">
        <div className="timeline-row" style={{ background: "color-mix(in srgb, white 40%, transparent)" }}>
          <div className="timeline-label muted">Task</div>
          <div className="timeline-track" style={{ display: "flex", fontSize: "0.65rem" }}>
            {days
              .filter((_, i) => i % 7 === 0)
              .map((d) => (
                <span key={toDateKey(d)} style={{ flex: "0 0 12.5%", paddingLeft: 4 }}>
                  {d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                </span>
              ))}
          </div>
        </div>
        {tasks.length === 0 ? (
          <p className="muted" style={{ padding: "1rem" }}>
            No dated tasks yet — set a due date on a task.
          </p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="timeline-row">
              <div className="timeline-label">
                <Link href={`/tasks/${task.id}`}>{task.title}</Link>
              </div>
              <div className="timeline-track">
                <Link
                  href={`/tasks/${task.id}`}
                  className="timeline-bar"
                  style={{
                    ...barStyle(task.startOn, task.dueOn),
                    opacity: task.completedAt ? 0.5 : 1,
                  }}
                >
                  {task.dueOn ? toDateKey(task.dueOn) : ""}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
