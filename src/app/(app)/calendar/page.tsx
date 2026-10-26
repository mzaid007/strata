import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { addDays, monthMatrix, parseMonthParam, toDateKey } from "@/lib/dates";

export default async function OrgCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { org } = await requireOrgContext();
  const anchor = parseMonthParam(month);
  const { first, cells } = monthMatrix(anchor);
  const rangeEnd = addDays(cells[cells.length - 1], 1);

  const tasks = await prisma.task.findMany({
    where: {
      organizationId: org.id,
      dueOn: { gte: cells[0], lt: rangeEnd },
    },
    select: { id: true, title: true, dueOn: true, completedAt: true },
    orderBy: { dueOn: "asc" },
    take: 400,
  });

  const byDay = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!t.dueOn) continue;
    const key = toDateKey(t.dueOn);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const label = first.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const prev = addDays(first, -1);
  const next = addDays(first, 32);
  const prevKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-sub">Due dates across the workspace — {label}.</p>
        </div>
        <div className="row">
          <Link className="btn btn-ghost" href={`/calendar?month=${prevKey}`}>
            Prev
          </Link>
          <Link className="btn btn-ghost" href={`/calendar?month=${nextKey}`}>
            Next
          </Link>
        </div>
      </div>
      <div className="calendar-grid" style={{ marginBottom: "0.35rem" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="muted" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
            {d}
          </div>
        ))}
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
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="calendar-task"
                  style={{ opacity: t.completedAt ? 0.55 : 1 }}
                >
                  {t.title}
                </Link>
              ))}
              {dayTasks.length > 4 ? (
                <span className="muted">+{dayTasks.length - 4} more</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
