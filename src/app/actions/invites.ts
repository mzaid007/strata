"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppOrigin } from "@/lib/app-origin";
import { requireOrgContext, requireUser } from "@/lib/session";
import { actionFail, actionOk, type ActionState } from "@/lib/action-result";

function isAdminRole(role: OrgRole) {
  return role === OrgRole.OWNER || role === OrgRole.ADMIN;
}

function inviteExpiry() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
}

export async function createOrgInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { session, membership, org } = await requireOrgContext();
  if (!isAdminRole(membership.role)) {
    return actionFail("Only owners and admins can invite members.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@") || email.length > 320) {
    return actionFail("Enter a valid email address.", { email: "Invalid" });
  }

  const existingMemberUser = await prisma.user.findUnique({ where: { email } });
  if (existingMemberUser) {
    const already = await prisma.orgMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: existingMemberUser.id,
        },
      },
    });
    if (already) {
      return actionFail("That person is already in this workspace.", {
        email: "Already a member",
      });
    }
  }

  const token = randomBytes(24).toString("hex");
  const invite = await prisma.orgInvite.create({
    data: {
      organizationId: org.id,
      email,
      token,
      invitedById: session.user.id,
      expiresAt: inviteExpiry(),
      role: OrgRole.MEMBER,
    },
  });

  const origin = getAppOrigin(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL,
  );
  const link = `${origin}/invite/${invite.token}`;

  // If they already have an account, add them immediately and keep the link as a backup.
  if (existingMemberUser) {
    await prisma.orgMembership.create({
      data: {
        organizationId: org.id,
        userId: existingMemberUser.id,
        role: OrgRole.MEMBER,
      },
    });
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: existingMemberUser.id,
        kind: "SYSTEM",
        title: `Added to ${org.name}`,
        body: "You can open projects and tasks in this workspace.",
        href: "/home",
      },
    });
    revalidatePath("/admin");
    revalidatePath("/inbox");
    return actionOk(
      `${existingMemberUser.name} added. Invite link (backup): ${link}`,
    );
  }

  revalidatePath("/admin");
  return actionOk(
    `Invite created for ${email}. Share this link (expires in 14 days): ${link}`,
  );
}

export async function acceptOrgInvite(token: string): Promise<ActionState> {
  const session = await requireUser();
  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!invite) return actionFail("Invite not found.");
  if (invite.acceptedAt) {
    return actionFail("This invite was already accepted.");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return actionFail("This invite has expired. Ask an admin for a new one.");
  }

  const email = session.user.email.trim().toLowerCase();
  if (email !== invite.email.toLowerCase()) {
    return actionFail(
      `Sign in as ${invite.email} to accept this invite (you are signed in as ${email}).`,
    );
  }

  const existing = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId: session.user.id,
      },
    },
  });
  if (!existing) {
    await prisma.orgMembership.create({
      data: {
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: invite.role,
      },
    });
  }

  await prisma.orgInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      kind: "SYSTEM",
      title: `Joined ${invite.organization.name}`,
      body: "Invite accepted.",
      href: "/home",
    },
  });

  revalidatePath("/", "layout");
  redirect("/home");
}
