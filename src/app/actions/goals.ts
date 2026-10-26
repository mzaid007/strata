"use server";

import { GoalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

const statuses = new Set(Object.values(GoalStatus));

export async function createGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetRaw = String(formData.get("targetDate") ?? "").trim();

  if (!title) return actionFail("Goal title is required.", { title: "Required" });

  let targetDate: Date | null = null;
  if (targetRaw) {
    const parsed = new Date(`${targetRaw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return actionFail("Target date looks invalid.", { targetDate: "Invalid" });
    }
    targetDate = parsed;
  }

  await prisma.goal.create({
    data: {
      organizationId: org.id,
      title,
      description,
      ownerId: session.user.id,
      targetDate,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/home");
  return actionOk("Goal created.");
}

export async function updateGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const goalId = String(formData.get("goalId") ?? "");
  const status = String(formData.get("status") ?? "") as GoalStatus;
  const progressRaw = String(formData.get("progress") ?? "0");

  if (!goalId) return actionFail("Missing goal.");
  if (!statuses.has(status)) return actionFail("Invalid status.");

  const progress = Math.max(0, Math.min(100, Number.parseInt(progressRaw, 10) || 0));

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, organizationId: org.id },
  });
  if (!goal) return actionFail("Goal not found.");

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      status,
      progress: status === GoalStatus.COMPLETE ? 100 : progress,
    },
  });

  revalidatePath("/goals");
  return actionOk("Goal updated.");
}
