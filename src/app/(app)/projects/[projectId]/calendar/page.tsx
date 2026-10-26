import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";
import { addDays, monthMatrix, parseMonthParam, toDateKey } from "@/lib/dates";

export default async function ProjectCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { projectId } = await params;
  const { month } = await searchParams;
  const { org } = await requireOrgContext();
  const anchor = parseMonthParam(month);
  const { first, cells } = monthMatrix(anchor);
  const rangeEnd = addDays(cells[cells.length - 1], 1);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  const memberships = await prisma.taskMembership.findMany({
    where: {
      projectId,
      task: { dueOn: { gte: cells[0], lt: rangeEnd } },
    },
    select: {
      task: { select: { id: true, title: true, dueOn: true, completedAt: true } },
    },
    take: 400,
  });

  const byDay = new Map<string, { id: string; title: string; completedAt: Date | null }[]>();
  for (const m of memberships) {
    if (!m.task.dueOn) continue;
    const key = toDateKey(m.task.dueOn);
    const list = byDay.get(key) ?? [];
    list.push(m.task);
    byDay.set(key, list);
  }

  const label = first.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const prev = addDays(first, -1);
  const next = addDays(first, 32);
  const prevKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">Project calendar — {label}.</p>
      <ProjectViewTabs projectId={project.id} active="Calendar" />
      <div className="row" style={{ marginBottom: "0.75rem" }}>
        <Link className="btn btn-ghost" href={`/projects/${project.id}/calendar?month=${prevKey}`}>
          Prev
        </Link>
        <Link className="btn btn-ghost" href={`/projects/${project.id}/calendar?month=${nextKey}`}>
          Next
        </Link>
      </div>
      <div className="calendar-grid">
        {cells.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getUTCMonth() === first.getUTCMonth();
          const dayTasks = byDay.get(key) ?? [];
          return (
            <div key={key} className={`calendar-cell${!inMonth ? " muted-day" : ""}`}>
              <div className="calendar-day-num">{day.getUTCDate()}</div>
              {dayTasks.slice(0, 4).map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="calendar-task">
                  {t.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
