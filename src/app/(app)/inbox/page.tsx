import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
  openNotification,
} from "@/app/actions/workspace";

export default async function InboxPage() {
  const { session } = await requireOrgContext();
  const notes = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = notes.filter((n) => !n.readAt).length;

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Inbox</h1>
          <p className="page-sub">
            Assignments, comments, and workspace notices
            {unread > 0 ? ` — ${unread} unread` : notes.length > 0 ? " — all caught up" : ""}.
          </p>
        </div>
        {unread > 0 ? (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsRead();
            }}
          >
            <button className="btn btn-ghost" type="submit">
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      <div className="card-list">
        {notes.length === 0 ? (
          <p className="muted">Inbox zero — comment on or assign a task to generate notices.</p>
        ) : null}
        {notes.map((n) => (
          <div
            key={n.id}
            className="card"
            style={{
              opacity: n.readAt ? 0.72 : 1,
              borderLeft: n.readAt
                ? "3px solid transparent"
                : "3px solid var(--accent)",
            }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="row" style={{ gap: "0.5rem", marginBottom: "0.15rem" }}>
                  {!n.readAt ? <span className="badge">Unread</span> : null}
                  <span className="muted" style={{ fontSize: "0.75rem" }}>
                    {n.kind}
                  </span>
                </div>
                <strong>{n.title}</strong>
                {n.body ? <p className="muted">{n.body}</p> : null}
                <p className="muted" style={{ marginTop: "0.25rem" }}>
                  {n.createdAt.toLocaleString()}
                </p>
                {n.href ? (
                  <form
                    action={async () => {
                      "use server";
                      await openNotification(n.id);
                    }}
                    style={{ marginTop: "0.5rem" }}
                  >
                    <button className="btn" type="submit">
                      Open
                    </button>
                  </form>
                ) : null}
              </div>
              {!n.readAt ? (
                <form
                  action={async () => {
                    "use server";
                    await markNotificationRead(n.id);
                  }}
                >
                  <button className="btn btn-ghost" type="submit">
                    Mark read
                  </button>
                </form>
              ) : (
                <span className="muted">Read</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
