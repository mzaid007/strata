import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { CreatePortfolioForm } from "@/components/CreatePortfolioForm";

export default async function PortfoliosPage() {
  const { org } = await requireOrgContext();
  const portfolios = await prisma.portfolio.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <h1 className="page-title">Portfolios</h1>
      <p className="page-sub">Group projects for a lightweight program view.</p>
      <CreatePortfolioForm />
      <div className="card-list">
        {portfolios.length === 0 ? <p className="muted">No portfolios yet.</p> : null}
        {portfolios.map((p) => (
          <Link key={p.id} href={`/portfolios/${p.id}`} className="card">
            <strong>{p.name}</strong>
            <p className="muted">{p._count.projects} projects</p>
          </Link>
        ))}
      </div>
    </>
  );
}
