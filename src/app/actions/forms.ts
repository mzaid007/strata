"use server";

import { FormFieldType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, requireUser } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "form"
  );
}

export async function createProjectForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!projectId) return actionFail("Missing project.");
  if (!title) return actionFail("Form title is required.", { title: "Required" });
  if (title.length > 120) return actionFail("Form title is too long.", { title: "Too long" });
  if (description.length > 2000) {
    return actionFail("Form description is too long.", { description: "Too long" });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
  });
  if (!project) return actionFail("Project not found.");

  let slug = slugify(title);
  const clash = await prisma.projectForm.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug } },
  });
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

  const form = await prisma.projectForm.create({
    data: {
      organizationId: org.id,
      projectId,
      title,
      description,
      slug,
      fields: {
        create: [
          {
            label: "Request title",
            fieldType: FormFieldType.TEXT,
            required: true,
            position: 1,
          },
          {
            label: "Details",
            fieldType: FormFieldType.TEXTAREA,
            required: true,
            position: 2,
          },
          {
            label: "Priority",
            fieldType: FormFieldType.SELECT,
            required: false,
            options: "Low,Medium,High",
            position: 3,
          },
        ],
      },
    },
  });

  revalidatePath(`/projects/${projectId}/forms`);
  redirect(`/projects/${projectId}/forms/${form.id}`);
}

export async function submitProjectForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();
  const formId = String(formData.get("formId") ?? "");
  if (!formId) return actionFail("Missing form.");

  const form = await prisma.projectForm.findFirst({
    where: { id: formId, isOpen: true },
    include: {
      fields: { orderBy: { position: "asc" } },
      project: { include: { sections: { orderBy: { position: "asc" }, take: 1 } } },
    },
  });
  if (!form) return actionFail("Form is closed or missing.");

  const membership = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: form.organizationId,
        userId: session.user.id,
      },
    },
  });
  if (!membership) return actionFail("You must be a workspace member to submit.");

  const payload: Record<string, string> = {};
  for (const field of form.fields) {
    const value = String(formData.get(`field_${field.id}`) ?? "").trim();
    if (field.required && !value) {
      return actionFail(`“${field.label}” is required.`, {
        [`field_${field.id}`]: "Required",
      });
    }
    if (value.length > 10000) {
      return actionFail(`“${field.label}” is too long.`, {
        [`field_${field.id}`]: "Too long",
      });
    }
    payload[field.label] = value;
  }

  const title =
    payload["Request title"] ||
    Object.values(payload).find((v) => v)?.slice(0, 120) ||
    `Form: ${form.title}`;

  const section = form.project.sections[0];
  if (!section) return actionFail("Project has no sections to receive tasks.");

  const max = await prisma.taskMembership.aggregate({
    where: { sectionId: section.id },
    _max: { position: true },
  });

  const description = Object.entries(payload)
    .map(([k, v]) => `**${k}:** ${v}`)
    .join("\n");

  const task = await prisma.task.create({
    data: {
      organizationId: form.organizationId,
      title,
      description,
      creatorId: session.user.id,
      assigneeId: session.user.id,
      memberships: {
        create: {
          projectId: form.projectId,
          sectionId: section.id,
          position: (max._max.position ?? 0) + 1,
        },
      },
    },
  });

  await prisma.formSubmission.create({
    data: {
      formId: form.id,
      payload: JSON.stringify(payload),
      createdTaskId: task.id,
    },
  });

  revalidatePath(`/projects/${form.projectId}`);
  revalidatePath(`/projects/${form.projectId}/forms`);
  revalidatePath(`/f/${form.slug}`);
  redirect(`/tasks/${task.id}`);
}
