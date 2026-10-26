import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { CreateFormForm } from "@/components/CreateFormForm";
import { ProjectViewTabs } from "@/components/ProjectViewTabs";

export default async function ProjectFormsPage({
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

  const forms = await prisma.projectForm.findMany({
    where: { projectId, organizationId: org.id },
    include: { _count: { select: { submissions: true, fields: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="page-title">{project.name}</h1>
      <p className="page-sub">Intake forms that create tasks in this project.</p>
      <ProjectViewTabs projectId={project.id} active="Forms" />
      <CreateFormForm projectId={project.id} />
      <div className="card-list">
        {forms.length === 0 ? <p className="muted">No forms yet.</p> : null}
        {forms.map((f) => (
          <div key={f.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{f.title}</strong>
              <span className="badge">{f.isOpen ? "Open" : "Closed"}</span>
            </div>
            <p className="muted">
              {f._count.fields} fields · {f._count.submissions} submissions
            </p>
            <div className="row" style={{ marginTop: "0.5rem" }}>
              <Link className="btn" href={`/projects/${project.id}/forms/${f.id}`}>
                Manage
              </Link>
              <Link className="btn btn-ghost" href={`/f/${f.slug}`}>
                Public link
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
