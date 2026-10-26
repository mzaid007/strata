"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrgRole, RuleTrigger } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOrgContext } from "@/lib/session";
import { runProjectRules } from "@/lib/rules";
import {
  actionFail,
  actionOk,
  type ActionState,
} from "@/lib/action-result";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "workspace"
  );
}

function isAdminRole(role: OrgRole) {
  return role === OrgRole.OWNER || role === OrgRole.ADMIN;
}

async function taskInOrg(taskId: string, orgId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, organizationId: orgId },
  });
}

async function projectInOrg(projectId: string, orgId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
}

async function sectionInOrg(sectionId: string, orgId: string) {
  return prisma.section.findFirst({
    where: { id: sectionId, project: { organizationId: orgId } },
    include: { project: true },
  });
}

export async function createWorkspace(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return actionFail("Workspace name is required.", { name: "Required" });
  }

  let slug = slugify(name);
  const clash = await prisma.organization.findUnique({ where: { slug } });
  if (clash) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await prisma.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: { userId: session.user.id, role: OrgRole.OWNER },
      },
      projects: {
        create: {
          name: "Getting started",
          description: "Your first project",
          sections: {
            create: [
              { name: "Todo", position: 1 },
              { name: "Doing", position: 2 },
              { name: "Done", position: 3 },
            ],
          },
        },
      },
    },
  });

  revalidatePath("/");
  redirect("/home");
}

export async function inviteMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { membership, org } = await requireOrgContext();
  if (!isAdminRole(membership.role)) {
    return actionFail("Only owners and admins can invite members.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return actionFail("Email is required.", { email: "Required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return actionFail(
      "No account with that email. Ask them to register first, then add them here.",
      { email: "Not registered" },
    );
  }

  const existing = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: { organizationId: org.id, userId: user.id },
    },
  });
  if (existing) {
    return actionFail("That person is already in this workspace.", {
      email: "Already a member",
    });
  }

  await prisma.orgMembership.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: OrgRole.MEMBER,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "SYSTEM",
      title: `Added to ${org.name}`,
      body: "You can open projects and tasks in this workspace.",
      href: "/home",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/inbox");
  return actionOk(`${user.name} added to the workspace.`);
}

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) {
    return actionFail("Project name is required.", { name: "Required" });
  }

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name,
      description: description || null,
      sections: {
        create: [
          { name: "Todo", position: 1 },
          { name: "Doing", position: 2 },
          { name: "Done", position: 3 },
        ],
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/home");
  redirect(`/projects/${project.id}`);
}

export async function createTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const title = String(formData.get("title") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  if (!title) {
    return actionFail("Task title is required.", { title: "Required" });
  }
  if (!projectId || !sectionId) {
    return actionFail("Choose a section for the new task.");
  }

  const project = await projectInOrg(projectId, org.id);
  if (!project) {
    return actionFail("Project not found in this workspace.");
  }

  const section = await prisma.section.findFirst({
    where: { id: sectionId, projectId },
  });
  if (!section) {
    return actionFail("Section does not belong to that project.");
  }

  const max = await prisma.taskMembership.aggregate({
    where: { sectionId },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      organizationId: org.id,
      title,
      creatorId: session.user.id,
      assigneeId: session.user.id,
      memberships: {
        create: {
          projectId,
          sectionId,
          position: (max._max.position ?? 0) + 1,
        },
      },
    },
  });

  await runProjectRules({
    organizationId: org.id,
    projectIds: [projectId],
    taskId: task.id,
    trigger: RuleTrigger.TASK_CREATED,
    actorUserId: session.user.id,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath("/my-tasks");
  redirect(`/tasks/${task.id}`);
}

export async function updateTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "");
  const startOnRaw = String(formData.get("startOn") ?? "").trim();
  const dueOnRaw = String(formData.get("dueOn") ?? "").trim();

  if (!taskId) return actionFail("Missing task.");
  if (!title) {
    return actionFail("Title is required.", { title: "Required" });
  }

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found in this workspace.");

  let assigneeId: string | null = null;
  if (assigneeIdRaw) {
    const member = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: assigneeIdRaw,
        },
      },
    });
    if (!member) {
      return actionFail("Assignee must be a workspace member.", {
        assigneeId: "Not a member",
      });
    }
    assigneeId = assigneeIdRaw;
  }

  let startOn: Date | null = null;
  if (startOnRaw) {
    const parsed = new Date(`${startOnRaw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return actionFail("Start date looks invalid.", { startOn: "Invalid date" });
    }
    startOn = parsed;
  }

  let dueOn: Date | null = null;
  if (dueOnRaw) {
    const parsed = new Date(`${dueOnRaw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return actionFail("Due date looks invalid.", { dueOn: "Invalid date" });
    }
    dueOn = parsed;
  }

  const previousAssignee = task.assigneeId;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      assigneeId,
      startOn,
      dueOn,
    },
  });

  if (assigneeId && assigneeId !== previousAssignee && assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        kind: "ASSIGNED",
        title: `${session.user.name} assigned you a task`,
        body: title,
        href: `/tasks/${taskId}`,
      },
    });
  }

  if (assigneeId && assigneeId !== previousAssignee) {
    const homes = await prisma.taskMembership.findMany({
      where: { taskId },
      select: { projectId: true },
    });
    await runProjectRules({
      organizationId: org.id,
      projectIds: homes.map((h) => h.projectId),
      taskId,
      trigger: RuleTrigger.TASK_ASSIGNED,
      actorUserId: session.user.id,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/inbox");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/workload");
  return actionOk("Task updated.");
}

export async function addComment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!taskId) return actionFail("Missing task.");
  if (!body) {
    return actionFail("Comment cannot be empty.", { body: "Required" });
  }

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found in this workspace.");

  await prisma.comment.create({
    data: { taskId, authorId: session.user.id, body },
  });

  if (task.assigneeId && task.assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        kind: "COMMENT",
        title: `${session.user.name} commented`,
        body: task.title,
        href: `/tasks/${taskId}`,
      },
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/inbox");
  revalidatePath("/home");
  return actionOk("Comment posted.");
}

export async function toggleTaskComplete(taskId: string) {
  const { session, org } = await requireOrgContext();
  const task = await taskInOrg(taskId, org.id);
  if (!task) return;

  const completing = !task.completedAt;
  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: completing ? new Date() : null },
  });

  const homes = await prisma.taskMembership.findMany({
    where: { taskId },
    select: { projectId: true },
  });

  if (completing) {
    await runProjectRules({
      organizationId: org.id,
      projectIds: homes.map((h) => h.projectId),
      taskId,
      trigger: RuleTrigger.TASK_COMPLETED,
      actorUserId: session.user.id,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/calendar");
  revalidatePath("/workload");
  for (const m of homes) {
    revalidatePath(`/projects/${m.projectId}`);
    revalidatePath(`/projects/${m.projectId}/board`);
    revalidatePath(`/projects/${m.projectId}/timeline`);
    revalidatePath(`/projects/${m.projectId}/calendar`);
    revalidatePath(`/projects/${m.projectId}/forms`);
    revalidatePath(`/projects/${m.projectId}/rules`);
  }
}

export async function addTaskToProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const placement = String(formData.get("placement") ?? "");
  const [projectId, sectionId] = placement.split(":");

  if (!taskId || !projectId || !sectionId) {
    return actionFail("Choose a project and section.");
  }

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found in this workspace.");

  const section = await sectionInOrg(sectionId, org.id);
  if (!section || section.projectId !== projectId) {
    return actionFail("That section is not in the selected project.");
  }
  if (section.project.organizationId !== org.id) {
    return actionFail("Project not found in this workspace.");
  }

  const max = await prisma.taskMembership.aggregate({
    where: { sectionId },
    _max: { position: true },
  });

  await prisma.taskMembership.upsert({
    where: { taskId_projectId: { taskId, projectId } },
    update: { sectionId, position: (max._max.position ?? 0) + 1 },
    create: {
      taskId,
      projectId,
      sectionId,
      position: (max._max.position ?? 0) + 1,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/board`);
  return actionOk("Task multi-homed.");
}

export async function moveTaskToSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");

  if (!taskId || !projectId || !sectionId) {
    return actionFail("Choose a section to move into.");
  }

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found in this workspace.");

  const project = await projectInOrg(projectId, org.id);
  if (!project) return actionFail("Project not found in this workspace.");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, projectId },
  });
  if (!section) {
    return actionFail("Section does not belong to this project.");
  }

  const membership = await prisma.taskMembership.findUnique({
    where: { taskId_projectId: { taskId, projectId } },
  });
  if (!membership) {
    return actionFail("Task is not in this project.");
  }
  if (membership.sectionId === sectionId) {
    return actionOk("Already in that section.");
  }

  const max = await prisma.taskMembership.aggregate({
    where: { sectionId },
    _max: { position: true },
  });

  await prisma.taskMembership.update({
    where: { id: membership.id },
    data: {
      sectionId,
      position: (max._max.position ?? 0) + 1,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath(`/projects/${projectId}/timeline`);
  return actionOk("Moved.");
}

/** DnD / programmatic move — same authz as form move. */
export async function moveTaskMembership(input: {
  taskId: string;
  projectId: string;
  sectionId: string;
  beforePosition?: number | null;
}): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const { taskId, projectId, sectionId } = input;

  const task = await taskInOrg(taskId, org.id);
  if (!task) return actionFail("Task not found in this workspace.");

  const project = await projectInOrg(projectId, org.id);
  if (!project) return actionFail("Project not found in this workspace.");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, projectId },
  });
  if (!section) return actionFail("Section does not belong to this project.");

  const membership = await prisma.taskMembership.findUnique({
    where: { taskId_projectId: { taskId, projectId } },
  });
  if (!membership) return actionFail("Task is not in this project.");

  let position: number;
  if (typeof input.beforePosition === "number") {
    position = input.beforePosition - 0.001;
  } else {
    const max = await prisma.taskMembership.aggregate({
      where: { sectionId },
      _max: { position: true },
    });
    position = (max._max.position ?? 0) + 1;
  }

  await prisma.taskMembership.update({
    where: { id: membership.id },
    data: { sectionId, position },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath(`/projects/${projectId}/timeline`);
  return actionOk("Moved.");
}

export async function markNotificationRead(id: string) {
  const { session } = await requireOrgContext();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/inbox");
  revalidatePath("/home");
}

export async function markAllNotificationsRead() {
  const { session } = await requireOrgContext();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/inbox");
  revalidatePath("/home");
}

/** Mark read then follow deep link (own notifications only). */
export async function openNotification(id: string) {
  const { session } = await requireOrgContext();
  const note = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!note) {
    redirect("/inbox");
  }

  if (!note.readAt) {
    await prisma.notification.update({
      where: { id: note.id },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/inbox");
  revalidatePath("/home");
  redirect(note.href || "/inbox");
}
