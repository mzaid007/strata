import { RuleAction, RuleTrigger, type AutomationRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RuleConfig = {
  sectionId?: string;
  commentBody?: string;
  assigneeId?: string;
};

type RuleConditions = {
  titleContains?: string;
  hasAssignee?: boolean;
  assigneeId?: string;
  onlyIfIncomplete?: boolean;
};

function parseConfig(raw: string): RuleConfig {
  try {
    return JSON.parse(raw) as RuleConfig;
  } catch {
    return {};
  }
}

function parseConditions(raw: string): RuleConditions {
  try {
    return JSON.parse(raw) as RuleConditions;
  } catch {
    return {};
  }
}

async function matchesConditions(
  rule: AutomationRule,
  taskId: string,
): Promise<boolean> {
  const conditions = parseConditions(rule.conditionConfig ?? "{}");
  const hasAny =
    Boolean(conditions.titleContains?.trim()) ||
    typeof conditions.hasAssignee === "boolean" ||
    Boolean(conditions.assigneeId) ||
    conditions.onlyIfIncomplete === true;
  if (!hasAny) return true;

  const task = await prisma.task.findFirst({
    where: { id: taskId },
    select: { title: true, assigneeId: true, completedAt: true },
  });
  if (!task) return false;

  if (conditions.titleContains?.trim()) {
    const needle = conditions.titleContains.trim().toLowerCase();
    if (!task.title.toLowerCase().includes(needle)) return false;
  }

  if (typeof conditions.hasAssignee === "boolean") {
    const has = Boolean(task.assigneeId);
    if (has !== conditions.hasAssignee) return false;
  }

  if (conditions.assigneeId) {
    if (task.assigneeId !== conditions.assigneeId) return false;
  }

  if (conditions.onlyIfIncomplete === true && task.completedAt) {
    return false;
  }

  return true;
}

export async function runProjectRules(opts: {
  organizationId: string;
  projectIds: string[];
  taskId: string;
  trigger: RuleTrigger;
  actorUserId?: string;
}) {
  if (opts.projectIds.length === 0) return;

  const rules = await prisma.automationRule.findMany({
    where: {
      organizationId: opts.organizationId,
      projectId: { in: opts.projectIds },
      enabled: true,
      trigger: opts.trigger,
    },
  });

  for (const rule of rules) {
    if (!(await matchesConditions(rule, opts.taskId))) continue;
    await applyRule(rule, opts.taskId, opts.actorUserId);
  }
}

async function applyRule(rule: AutomationRule, taskId: string, actorUserId?: string) {
  const cfg = parseConfig(rule.actionConfig);

  if (rule.action === RuleAction.MOVE_TO_SECTION && cfg.sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: cfg.sectionId, projectId: rule.projectId },
    });
    if (!section) return;
    const membership = await prisma.taskMembership.findUnique({
      where: { taskId_projectId: { taskId, projectId: rule.projectId } },
    });
    if (!membership) return;
    const max = await prisma.taskMembership.aggregate({
      where: { sectionId: section.id },
      _max: { position: true },
    });
    await prisma.taskMembership.update({
      where: { id: membership.id },
      data: { sectionId: section.id, position: (max._max.position ?? 0) + 1 },
    });
    return;
  }

  if (rule.action === RuleAction.ADD_COMMENT && cfg.commentBody && actorUserId) {
    await prisma.comment.create({
      data: {
        taskId,
        authorId: actorUserId,
        body: cfg.commentBody,
      },
    });
    return;
  }

  if (rule.action === RuleAction.SET_ASSIGNEE && cfg.assigneeId) {
    const member = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: rule.organizationId,
          userId: cfg.assigneeId,
        },
      },
    });
    if (!member) return;
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: cfg.assigneeId },
    });
  }
}
