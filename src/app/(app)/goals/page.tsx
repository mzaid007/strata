import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { CreateGoalForm } from "@/components/CreateGoalForm";
import { UpdateGoalForm } from "@/components/UpdateGoalForm";

export default async function GoalsPage() {
  const { org } = await requireOrgContext();
  const goals = await prisma.goal.findMany({
    where: { organizationId: org.id },
    include: { owner: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <>
      <h1 className="page-title">Goals</h1>
      <p className="page-sub">Outcome tracking for {org.name} — progress, status, owners.</p>
      <CreateGoalForm />
      <div className="card-list">
        {goals.length === 0 ? <p className="muted">No goals yet.</p> : null}
        {goals.map((g) => (
          <div key={g.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{g.title}</strong>
              <span className="badge">{g.status.replaceAll("_", " ")}</span>
            </div>
            {g.description ? <p className="muted">{g.description}</p> : null}
            <p className="muted" style={{ marginBottom: "0.45rem" }}>
              {g.owner?.name ?? "Unowned"}
              {g.targetDate ? ` · target ${g.targetDate.toISOString().slice(0, 10)}` : ""}
              {` · ${g.progress}%`}
            </p>
            <div className="progress-meter" aria-hidden>
              <span style={{ width: `${g.progress}%` }} />
            </div>
            <UpdateGoalForm goalId={g.id} status={g.status} progress={g.progress} />
          </div>
        ))}
      </div>
    </>
  );
}
