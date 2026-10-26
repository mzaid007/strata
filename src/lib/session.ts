import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
export const getPrimaryMembership = cache(async (userId: string) => {
  return prisma.orgMembership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
});

/** Request-scoped org context — safe to call from layout and pages. */
export const requireOrgContext = cache(async () => {
  const session = await requireUser();
  const membership = await getPrimaryMembership(session.user.id);
  if (!membership) {
    redirect("/onboarding");
  }
  return { session, membership, org: membership.organization };
});
