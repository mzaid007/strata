"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

async function taskInOrg(taskId: string, orgId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, organizationId: orgId },
  });
}

export async function createSubtask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const parentTaskId = String(formData.get("parentTaskId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!parentTaskId) return actionFail("Missing parent task.");
  if (!title) return actionFail("Subtask title is required.", { title: "Required" });
  if (title.length > 200) return actionFail("Title is too long.", { title: "Too long" });

  const parent = await taskInOrg(parentTaskId, org.id);
  if (!parent) return actionFail("Parent task not found.");
  if (parent.parentTaskId) {
    return actionFail("Nested subtasks beyond one level are not supported yet.");
  }

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title,
      parentTaskId,
      creatorId: session.user.id,
      assigneeId: session.user.id,
    },
  });

  revalidatePath(`/tasks/${parentTaskId}`);
  revalidatePath("/my-tasks");
  return actionOk("Subtask added.");
}

export async function toggleSubtaskComplete(subtaskId: string) {
  const { org } = await requireOrgContext();
  const task = await taskInOrg(subtaskId, org.id);
  if (!task || !task.parentTaskId) return;

  await prisma.task.update({
    where: { id: subtaskId },
    data: { completedAt: task.completedAt ? null : new Date() },
  });

  revalidatePath(`/tasks/${task.parentTaskId}`);
  revalidatePath(`/tasks/${subtaskId}`);
  revalidatePath("/my-tasks");
}

export async function addTaskFollower(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!taskId || !userId) return actionFail("Choose a follower.");

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found.");

  const member = await prisma.orgMembership.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId } },
  });
  if (!member) return actionFail("Follower must be a workspace member.");

  await prisma.taskFollower.upsert({
    where: { taskId_userId: { taskId, userId } },
    update: {},
    create: { taskId, userId },
  });

  revalidatePath(`/tasks/${taskId}`);
  return actionOk("Follower added.");
}

export async function removeTaskFollower(taskId: string, userId: string) {
  const { org } = await requireOrgContext();
  const task = await taskInOrg(taskId, org.id);
  if (!task) return;

  await prisma.taskFollower.deleteMany({
    where: { taskId, userId },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function followTaskMyself(taskId: string) {
  const { session, org } = await requireOrgContext();
  const task = await taskInOrg(taskId, org.id);
  if (!task) return;

  await prisma.taskFollower.upsert({
    where: { taskId_userId: { taskId, userId: session.user.id } },
    update: {},
    create: { taskId, userId: session.user.id },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function unfollowTaskMyself(taskId: string) {
  const { session, org } = await requireOrgContext();
  await prisma.taskFollower.deleteMany({
    where: { taskId, userId: session.user.id },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function addTaskDependency(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const otherTaskId = String(formData.get("otherTaskId") ?? "");
  const relation = String(formData.get("relation") ?? "blocked_by");

  if (!taskId || !otherTaskId) return actionFail("Choose a related task.");
  if (taskId === otherTaskId) return actionFail("A task cannot depend on itself.");

  const [task, other] = await Promise.all([
    taskInOrg(taskId, org.id),
    taskInOrg(otherTaskId, org.id),
  ]);
  if (!task || !other) return actionFail("Both tasks must be in this workspace.");

  const blockerId = relation === "blocking" ? taskId : otherTaskId;
  const blockedId = relation === "blocking" ? otherTaskId : taskId;

  const existing = await prisma.taskDependency.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  if (existing) return actionFail("That dependency already exists.");

  const reverse = await prisma.taskDependency.findUnique({
    where: { blockerId_blockedId: { blockerId: blockedId, blockedId: blockerId } },
  });
  if (reverse) return actionFail("That would create a direct cycle.");

  await prisma.taskDependency.create({
    data: {
      organizationId: org.id,
      blockerId,
      blockedId,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${otherTaskId}`);
  for (const home of await prisma.taskMembership.findMany({
    where: { taskId: { in: [taskId, otherTaskId] } },
    select: { projectId: true },
  })) {
    revalidatePath(`/projects/${home.projectId}/timeline`);
  }
  return actionOk("Dependency added.");
}

export async function removeTaskDependency(dependencyId: string) {
  const { org } = await requireOrgContext();
  const dep = await prisma.taskDependency.findFirst({
    where: { id: dependencyId, organizationId: org.id },
  });
  if (!dep) return;

  await prisma.taskDependency.delete({ where: { id: dependencyId } });
  revalidatePath(`/tasks/${dep.blockerId}`);
  revalidatePath(`/tasks/${dep.blockedId}`);
  for (const home of await prisma.taskMembership.findMany({
    where: { taskId: { in: [dep.blockerId, dep.blockedId] } },
    select: { projectId: true },
  })) {
    revalidatePath(`/projects/${home.projectId}/timeline`);
  }
}
