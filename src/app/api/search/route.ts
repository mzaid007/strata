import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberships, getSession, ACTIVE_ORG_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await getMemberships(session.user.id);
  if (memberships.length === 0) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.organizationId === activeOrgId) ?? memberships[0]!;
  const orgId = membership.organizationId;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ tasks: [], projects: [] });
  }
  if (q.length > 120) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        organizationId: orgId,
        title: { contains: q, mode: "insensitive" },
        parentTaskId: null,
      },
      select: {
        id: true,
        title: true,
        completedAt: true,
        memberships: {
          take: 1,
          select: { project: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.project.findMany({
      where: {
        organizationId: orgId,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: Boolean(t.completedAt),
      projectName: t.memberships[0]?.project.name ?? null,
    })),
    projects,
  });
}
