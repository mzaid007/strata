"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

export async function createPortfolio(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return actionFail("Portfolio name is required.", { name: "Required" });
  if (name.length > 120) return actionFail("Portfolio name is too long.", { name: "Too long" });
  if (description.length > 2000) {
    return actionFail("Portfolio description is too long.", { description: "Too long" });
  }

  const portfolio = await prisma.portfolio.create({
    data: {
      organizationId: org.id,
      name,
      description: description || null,
    },
  });

  revalidatePath("/portfolios");
  redirect(`/portfolios/${portfolio.id}`);
}

export async function addProjectToPortfolio(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const portfolioId = String(formData.get("portfolioId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  if (!portfolioId || !projectId) {
    return actionFail("Choose a project to add.");
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, organizationId: org.id },
  });
  if (!portfolio) return actionFail("Portfolio not found.");

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
  });
  if (!project) return actionFail("Project not found in this workspace.");

  await prisma.portfolioProject.upsert({
    where: {
      portfolioId_projectId: { portfolioId, projectId },
    },
    update: {},
    create: { portfolioId, projectId },
  });

  revalidatePath(`/portfolios/${portfolioId}`);
  revalidatePath("/portfolios");
  return actionOk("Project added.");
}
