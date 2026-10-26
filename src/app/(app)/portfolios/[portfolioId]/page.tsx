import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { AddPortfolioProjectForm } from "@/components/AddPortfolioProjectForm";

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = await params;
  const { org } = await requireOrgContext();

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, organizationId: org.id },
    include: {
      projects: {
        include: {
          project: {
            include: {
              _count: { select: { memberships: true, sections: true } },
            },
          },
        },
      },
    },
  });
  if (!portfolio) notFound();

  const linkedIds = new Set(portfolio.projects.map((p) => p.projectId));
  const available = await prisma.project.findMany({
    where: { organizationId: org.id, id: { notIn: [...linkedIds] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <p className="muted">
        <Link href="/portfolios">← Portfolios</Link>
      </p>
      <h1 className="page-title">{portfolio.name}</h1>
      <p className="page-sub">{portfolio.description || "Projects in this portfolio."}</p>

      <div className="card-list" style={{ marginBottom: "1rem" }}>
        {portfolio.projects.length === 0 ? (
          <p className="muted">No projects linked yet.</p>
        ) : (
          portfolio.projects.map((row) => (
            <Link key={row.id} href={`/projects/${row.project.id}`} className="card">
              <strong>{row.project.name}</strong>
              <p className="muted">
                {row.project._count.sections} sections · {row.project._count.memberships} placements
              </p>
            </Link>
          ))
        )}
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Add project</h2>
        <AddPortfolioProjectForm portfolioId={portfolio.id} projects={available} />
      </section>
    </>
  );
}
