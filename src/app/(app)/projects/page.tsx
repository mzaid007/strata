import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { CreateProjectForm } from "@/components/CreateProjectForm";

export default async function ProjectsPage() {
  const { org } = await requireOrgContext();
  const projects = await prisma.project.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { sections: true, memberships: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <h1 className="page-title">Projects</h1>
      <p className="page-sub">Shared hubs of sections and multi-homed tasks.</p>
      <CreateProjectForm />
      <div className="card-list">
        {projects.length === 0 ? (
          <p className="muted">No projects yet — create one above.</p>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="list-row">
              <strong>{p.name}</strong>
              <p className="muted">
                {p._count.sections} sections · {p._count.memberships} task placements
              </p>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
