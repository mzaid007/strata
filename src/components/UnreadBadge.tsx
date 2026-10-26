import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";

/** Isolated so the shell can stream while the count loads. */
export async function UnreadBadge() {
  const { session } = await requireOrgContext();
  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
  if (unreadCount <= 0) return null;
  return (
    <span className="nav-badge" aria-label={`${unreadCount} unread`}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
