import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { BoardDnD } from "@/components/BoardDnD";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";

export default async function ProjectBoardPage({
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
      sections: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          memberships: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              position: true,
              sectionId: true,
              task: { select: { id: true, title: true, completedAt: true } },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const sections = project.sections.map((section) => ({
    id: section.id,
    name: section.name,
    tasks: section.memberships.map((m) => ({
      membershipId: m.id,
      taskId: m.task.id,
      title: m.task.title,
      completed: Boolean(m.task.completedAt),
      position: m.position,
      sectionId: m.sectionId,
    })),
  }));

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">Board — drag cards between columns, or use Move to section.</p>
      <ProjectViewTabs projectId={project.id} active="Board" />
      <BoardDnD projectId={project.id} sections={sections} />
    </>
  );
}
