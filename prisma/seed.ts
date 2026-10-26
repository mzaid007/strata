import { GoalStatus, OrgRole, RuleAction, RuleTrigger } from "@prisma/client";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function ensureUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!result?.user) {
    throw new Error(`Failed to create user ${email}`);
  }

  return prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
}

async function main() {
  const owner = await ensureUser("ava@strata.local", "Ava Chen", "strata-demo-1");
  const member = await ensureUser("ben@strata.local", "Ben Ortiz", "strata-demo-1");

  const org = await prisma.organization.upsert({
    where: { slug: "strata-demo" },
    update: { name: "Strata Demo Co" },
    create: { name: "Strata Demo Co", slug: "strata-demo" },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: { role: OrgRole.OWNER },
    create: { organizationId: org.id, userId: owner.id, role: OrgRole.OWNER },
  });
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: member.id } },
    update: { role: OrgRole.MEMBER },
    create: { organizationId: org.id, userId: member.id, role: OrgRole.MEMBER },
  });

  let team = await prisma.team.findFirst({
    where: { organizationId: org.id, name: "Product" },
  });
  if (!team) {
    team = await prisma.team.create({
      data: { organizationId: org.id, name: "Product" },
    });
  }

  await prisma.notification.deleteMany({
    where: { userId: { in: [owner.id, member.id] } },
  });
  await prisma.automationRule.deleteMany({ where: { organizationId: org.id } });
  await prisma.formSubmission.deleteMany({
    where: { form: { organizationId: org.id } },
  });
  await prisma.formField.deleteMany({
    where: { form: { organizationId: org.id } },
  });
  await prisma.projectForm.deleteMany({ where: { organizationId: org.id } });
  await prisma.portfolioProject.deleteMany({
    where: { portfolio: { organizationId: org.id } },
  });
  await prisma.portfolio.deleteMany({ where: { organizationId: org.id } });
  await prisma.goal.deleteMany({ where: { organizationId: org.id } });
  await prisma.project.deleteMany({ where: { organizationId: org.id } });
  await prisma.task.deleteMany({ where: { organizationId: org.id } });

  const launch = await prisma.project.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      name: "Product Launch",
      description: "Ship Strata Core to the internal team.",
      color: "#2F6F5E",
      sections: {
        create: [
          { name: "Backlog", position: 1 },
          { name: "In progress", position: 2 },
          { name: "Review", position: 3 },
          { name: "Done", position: 4 },
        ],
      },
    },
    include: { sections: { orderBy: { position: "asc" } } },
  });

  const ops = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: "Ops Checklist",
      description: "Day-two operational work.",
      color: "#8B5E3C",
      sections: {
        create: [
          { name: "Todo", position: 1 },
          { name: "Doing", position: 2 },
          { name: "Done", position: 3 },
        ],
      },
    },
    include: { sections: { orderBy: { position: "asc" } } },
  });

  const [backlog, inProgress, review, done] = launch.sections;
  const [opsTodo] = ops.sections;

  const authTask = await prisma.task.create({
    data: {
      organizationId: org.id,
      title: "Wire email/password auth",
      description: "Register, login, session cookie — no SSO.",
      assigneeId: owner.id,
      creatorId: owner.id,
      startOn: new Date(Date.now() - 2 * 86400000),
      dueOn: new Date(Date.now() + 3 * 86400000),
      memberships: {
        create: [
          { projectId: launch.id, sectionId: inProgress.id, position: 1 },
          { projectId: ops.id, sectionId: opsTodo.id, position: 1 },
        ],
      },
      comments: {
        create: {
          authorId: member.id,
          body: "Looks good — keep credential auth only for Core.",
        },
      },
    },
  });

  const multiHomeTask = await prisma.task.create({
    data: {
      organizationId: org.id,
      title: "Model multi-home memberships",
      description: "TaskMembership links a task to many projects/sections.",
      assigneeId: member.id,
      creatorId: owner.id,
      startOn: new Date(Date.now() - 1 * 86400000),
      dueOn: new Date(Date.now() + 8 * 86400000),
      memberships: {
        create: [{ projectId: launch.id, sectionId: backlog.id, position: 1 }],
      },
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: "Board + list views",
      description: "Same sections, two projections.",
      assigneeId: owner.id,
      creatorId: owner.id,
      dueOn: new Date(Date.now() + 1 * 86400000),
      memberships: {
        create: [{ projectId: launch.id, sectionId: review.id, position: 1 }],
      },
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: "Calendar and timeline polish",
      description: "Seeded for calendar/timeline demos.",
      assigneeId: member.id,
      creatorId: owner.id,
      startOn: new Date(),
      dueOn: new Date(Date.now() + 14 * 86400000),
      memberships: {
        create: [{ projectId: launch.id, sectionId: backlog.id, position: 2 }],
      },
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        organizationId: org.id,
        title: "Internal launch readiness",
        description: "Core + views usable by the whole company.",
        status: GoalStatus.ON_TRACK,
        progress: 55,
        ownerId: owner.id,
        targetDate: new Date(Date.now() + 30 * 86400000),
      },
      {
        organizationId: org.id,
        title: "Inbox zero culture",
        description: "Keep notification loop healthy.",
        status: GoalStatus.AT_RISK,
        progress: 20,
        ownerId: member.id,
        targetDate: new Date(Date.now() + 45 * 86400000),
      },
    ],
  });

  const portfolio = await prisma.portfolio.create({
    data: {
      organizationId: org.id,
      name: "Company initiatives",
      description: "Cross-team work worth watching.",
      projects: {
        create: [{ projectId: launch.id }, { projectId: ops.id }],
      },
    },
  });

  const intake = await prisma.projectForm.create({
    data: {
      organizationId: org.id,
      projectId: launch.id,
      title: "Launch intake",
      description: "Request work on Product Launch.",
      slug: "launch-intake",
      fields: {
        create: [
          { label: "Request title", fieldType: "TEXT", required: true, position: 1 },
          { label: "Details", fieldType: "TEXTAREA", required: true, position: 2 },
          {
            label: "Priority",
            fieldType: "SELECT",
            required: false,
            options: "Low,Medium,High",
            position: 3,
          },
        ],
      },
    },
  });

  await prisma.automationRule.create({
    data: {
      organizationId: org.id,
      projectId: launch.id,
      name: "Completed → Done",
      trigger: RuleTrigger.TASK_COMPLETED,
      action: RuleAction.MOVE_TO_SECTION,
      actionConfig: JSON.stringify({ sectionId: done.id }),
      enabled: true,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        kind: "COMMENT",
        title: "Ben commented",
        body: "On “Wire email/password auth”",
        href: `/tasks/${authTask.id}`,
      },
      {
        userId: member.id,
        kind: "ASSIGNED",
        title: "You were assigned a task",
        body: "Model multi-home memberships",
        href: `/tasks/${multiHomeTask.id}`,
      },
    ],
  });

  console.log("Seeded Strata demo workspace.");
  console.log("  Login: ava@strata.local / strata-demo-1  (owner)");
  console.log("  Login: ben@strata.local / strata-demo-1  (member)");
  console.log(`  Portfolio: ${portfolio.name}`);
  console.log(`  Form: /f/${intake.slug}`);
  console.log("  Multi-home demo: “Wire email/password auth” lives in Product Launch + Ops Checklist.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
