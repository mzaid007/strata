"use server";

import { RuleAction, RuleTrigger } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

const triggers = new Set(Object.values(RuleTrigger));
const actions = new Set(Object.values(RuleAction));

export async function createAutomationRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org } = await requireOrgContext();
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const trigger = String(formData.get("trigger") ?? "") as RuleTrigger;
  const action = String(formData.get("action") ?? "") as RuleAction;
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const commentBody = String(formData.get("commentBody") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const titleContains = String(formData.get("titleContains") ?? "").trim();
  const hasAssigneeRaw = String(formData.get("hasAssignee") ?? "").trim();
  const conditionAssigneeId = String(formData.get("conditionAssigneeId") ?? "").trim();
  const onlyIfIncomplete = formData.get("onlyIfIncomplete") === "on";

  if (!projectId) return actionFail("Missing project.");
  if (!name) return actionFail("Rule name is required.", { name: "Required" });
  if (name.length > 120) return actionFail("Rule name is too long.", { name: "Too long" });
  if (!triggers.has(trigger)) return actionFail("Pick a trigger.");
  if (!actions.has(action)) return actionFail("Pick an action.");

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
  });
  if (!project) return actionFail("Project not found.");

  const actionConfig: Record<string, string> = {};
  if (action === RuleAction.MOVE_TO_SECTION) {
    if (!sectionId) return actionFail("Choose a target section.");
    const section = await prisma.section.findFirst({
      where: { id: sectionId, projectId },
    });
    if (!section) return actionFail("Section not in this project.");
    actionConfig.sectionId = sectionId;
  }
  if (action === RuleAction.ADD_COMMENT) {
    if (!commentBody) return actionFail("Comment body is required.");
    if (commentBody.length > 2000) return actionFail("Comment body is too long.");
    actionConfig.commentBody = commentBody;
  }
  if (action === RuleAction.SET_ASSIGNEE) {
    if (!assigneeId) return actionFail("Choose an assignee.");
    const member = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: { organizationId: org.id, userId: assigneeId },
      },
    });
    if (!member) return actionFail("Assignee must be a workspace member.");
    actionConfig.assigneeId = assigneeId;
  }

  const conditionConfig: Record<string, string | boolean> = {};
  if (titleContains) {
    if (titleContains.length > 120) {
      return actionFail("Title contains filter is too long.");
    }
    conditionConfig.titleContains = titleContains;
  }
  if (hasAssigneeRaw === "yes") conditionConfig.hasAssignee = true;
  if (hasAssigneeRaw === "no") conditionConfig.hasAssignee = false;
  if (conditionAssigneeId) {
    const member = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: conditionAssigneeId,
        },
      },
    });
    if (!member) return actionFail("Condition assignee must be a workspace member.");
    conditionConfig.assigneeId = conditionAssigneeId;
  }
  if (onlyIfIncomplete) conditionConfig.onlyIfIncomplete = true;

  await prisma.automationRule.create({
    data: {
      organizationId: org.id,
      projectId,
      name,
      trigger,
      action,
      actionConfig: JSON.stringify(actionConfig),
      conditionConfig: JSON.stringify(conditionConfig),
    },
  });

  revalidatePath(`/projects/${projectId}/rules`);
  return actionOk("Rule created.");
}

export async function toggleAutomationRule(ruleId: string) {
  const { org } = await requireOrgContext();
  const rule = await prisma.automationRule.findFirst({
    where: { id: ruleId, organizationId: org.id },
  });
  if (!rule) return;

  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { enabled: !rule.enabled },
  });
  revalidatePath(`/projects/${rule.projectId}/rules`);
}
