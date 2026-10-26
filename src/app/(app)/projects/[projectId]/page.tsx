import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { MoveToSectionForm } from "@/components/MoveToSectionForm";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { org } = await requireOrgContext();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
    select: {
      id: true,
      name: true,
      description: true,
      sections: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          memberships: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              task: {
                select: {
                  id: true,
                  title: true,
                  completedAt: true,
                  assignee: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const sectionOptions = project.sections.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">{project.description || "List view by section."}</p>
      <ProjectViewTabs projectId={project.id} active="List" />
      <CreateTaskForm projectId={project.id} sections={sectionOptions} />

      <div className="card-list">
        {project.sections.map((section) => (
          <section key={section.id} className="card">
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>{section.name}</h2>
            {section.memberships.length === 0 ? (
              <p className="muted">Empty</p>
            ) : (
              section.memberships.map((m) => (
                <div key={m.id} className="task-pill">
                  <Link href={`/tasks/${m.task.id}`}>
                    <strong
                      style={{ textDecoration: m.task.completedAt ? "line-through" : "none" }}
                    >
                      {m.task.title}
                    </strong>
                    <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                      {m.task.assignee?.name ?? "Unassigned"}
                    </p>
                  </Link>
                  <div style={{ marginTop: "0.5rem" }}>
                    <MoveToSectionForm
                      taskId={m.task.id}
                      projectId={project.id}
                      currentSectionId={section.id}
                      sections={sectionOptions}
                      compact
                    />
                  </div>
                </div>
              ))
            )}
          </section>
        ))}
      </div>
    </>
  );
}
