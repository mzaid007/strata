import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_ORG_COOKIE = "strata_org";

/** Request-scoped: layout + page share one session fetch. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/** Request-scoped membership lookup. */
export const getMemberships = cache(async (userId: string) => {
  return prisma.orgMembership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
});

export const getPrimaryMembership = cache(async (userId: string) => {
  const memberships = await getMemberships(userId);
  return memberships[0] ?? null;
});

/** Request-scoped org context — safe to call from layout and pages. */
export const requireOrgContext = cache(async () => {
  const session = await requireUser();
  const memberships = await getMemberships(session.user.id);
  const fallback = memberships[0];
  if (!fallback) {
    redirect("/onboarding");
  }

  const activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.organizationId === activeOrgId) ?? fallback;

  return { session, membership, org: membership.organization, memberships };
});
