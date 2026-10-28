import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { toggleAutomationRule } from "@/app/actions/rules";
import { CreateRuleForm } from "@/components/CreateRuleForm";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";

function summarizeConditions(raw: string) {
  try {
    const c = JSON.parse(raw || "{}") as {
      titleContains?: string;
      hasAssignee?: boolean;
      assigneeId?: string;
      onlyIfIncomplete?: boolean;
    };
    const bits: string[] = [];
    if (c.titleContains) bits.push(`title~"${c.titleContains}"`);
    if (typeof c.hasAssignee === "boolean") {
      bits.push(c.hasAssignee ? "assigned" : "unassigned");
    }
    if (c.assigneeId) bits.push("specific assignee");
    if (c.onlyIfIncomplete) bits.push("incomplete only");
    return bits.length ? ` · if ${bits.join(", ")}` : "";
  } catch {
    return "";
  }
}

export default async function ProjectRulesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { org } = await requireOrgContext();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
    include: { sections: { orderBy: { position: "asc" } } },
  });
  if (!project) notFound();

  const [rules, members] = await Promise.all([
    prisma.automationRule.findMany({
      where: { projectId, organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orgMembership.findMany({
      where: { organizationId: org.id },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">
        Rules with optional conditions (title contains, assignee, incomplete-only).
      </p>
      <ProjectViewTabs projectId={project.id} active="Rules" />
      <CreateRuleForm
        projectId={project.id}
        sections={project.sections.map((s) => ({ id: s.id, name: s.name }))}
        members={members.map((m) => ({ id: m.user.id, name: m.user.name }))}
      />
      <div className="card-list">
        {rules.length === 0 ? <p className="muted">No rules yet.</p> : null}
        {rules.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{r.name}</strong>
                <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                  When {r.trigger.replaceAll("_", " ").toLowerCase()} →{" "}
                  {r.action.replaceAll("_", " ").toLowerCase()}
                  {summarizeConditions(r.conditionConfig)}
                </p>
              </div>
              <span className="badge">{r.enabled ? "On" : "Off"}</span>
            </div>
            <form
              action={async () => {
                "use server";
                await toggleAutomationRule(r.id);
              }}
              style={{ marginTop: "0.55rem" }}
            >
              <button className="btn btn-ghost" type="submit">
                {r.enabled ? "Disable" : "Enable"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
