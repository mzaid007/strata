import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { aiConfigured } from "@/lib/ai";
import { toggleTaskComplete } from "@/app/actions/workspace";
import { AddCommentForm } from "@/components/AddCommentForm";
import { AttachmentUploadForm } from "@/components/AttachmentUploadForm";
import { MultiHomeForm } from "@/components/MultiHomeForm";
import { MoveToSectionForm } from "@/components/MoveToSectionForm";
import { TaskAiPanel } from "@/components/TaskAiPanel";
import { UpdateTaskForm } from "@/components/UpdateTaskForm";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const { org } = await requireOrgContext();

  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: org.id },
    select: {
      id: true,
      title: true,
      description: true,
      completedAt: true,
      startOn: true,
      dueOn: true,
      assigneeId: true,
      assignee: { select: { name: true } },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      memberships: {
        select: {
          id: true,
          projectId: true,
          sectionId: true,
          project: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          sizeBytes: true,
          storageKey: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!task) notFound();

  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        name: true,
        sections: { select: { id: true, name: true }, orderBy: { position: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.orgMembership.findMany({
      where: { organizationId: org.id },
      select: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const placements = projects.flatMap((p) =>
    p.sections.map((s) => ({
      value: `${p.id}:${s.id}`,
      label: `${p.name} · ${s.name}`,
    })),
  );

  return (
    <>
      <p className="muted">
        <Link href="/my-tasks">← My Tasks</Link>
      </p>
      <h1
        className="page-title"
        style={{ textDecoration: task.completedAt ? "line-through" : "none" }}
      >
        {task.title}
      </h1>
      <p className="page-sub">{task.description || "No description yet."}</p>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <span className="badge">{task.assignee?.name ?? "Unassigned"}</span>
        {task.dueOn ? (
          <span className="muted">Due {task.dueOn.toISOString().slice(0, 10)}</span>
        ) : null}
        <form
          action={async () => {
            "use server";
            await toggleTaskComplete(task.id);
          }}
        >
          <button className="btn btn-ghost" type="submit">
            {task.completedAt ? "Reopen" : "Mark complete"}
          </button>
        </form>
      </div>

      <UpdateTaskForm
        taskId={task.id}
        title={task.title}
        description={task.description}
        assigneeId={task.assigneeId}
        startOn={task.startOn ? task.startOn.toISOString().slice(0, 10) : null}
        dueOn={task.dueOn ? task.dueOn.toISOString().slice(0, 10) : null}
        members={members.map((m) => ({ id: m.user.id, name: m.user.name }))}
      />

      <TaskAiPanel taskId={task.id} configured={aiConfigured()} />

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Homed in (multi-home)</h2>
        {task.memberships.length === 0 ? (
          <p className="muted">Not in any project yet.</p>
        ) : (
          <ul style={{ paddingLeft: "1.1rem", margin: "0 0 1rem" }}>
            {task.memberships.map((m) => (
              <li key={m.id} style={{ marginBottom: "0.85rem" }}>
                <Link href={`/projects/${m.projectId}`}>
                  {m.project.name} · {m.section.name}
                </Link>
                <div style={{ marginTop: "0.35rem" }}>
                  <MoveToSectionForm
                    taskId={task.id}
                    projectId={m.projectId}
                    currentSectionId={m.sectionId}
                    sections={
                      projects.find((p) => p.id === m.projectId)?.sections.map((s) => ({
                        id: s.id,
                        name: s.name,
                      })) ?? []
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <MultiHomeForm taskId={task.id} placements={placements} />
      </section>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Comments</h2>
        <div className="card-list">
          {task.comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            task.comments.map((c) => (
              <div key={c.id}>
                <strong>{c.author.name}</strong>
                <p style={{ margin: "0.25rem 0" }}>{c.body}</p>
                <p className="muted">{c.createdAt.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
        <AddCommentForm taskId={task.id} />
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Attachments</h2>
        {task.attachments.length === 0 ? (
          <p className="muted">No files yet.</p>
        ) : (
          <ul style={{ paddingLeft: "1.1rem" }}>
            {task.attachments.map((a) => (
              <li key={a.id} style={{ marginBottom: "0.35rem" }}>
                <a href={`/api/uploads/${a.storageKey.split("/").map(encodeURIComponent).join("/")}`}>
                  {a.fileName}
                </a>{" "}
                <span className="muted">({a.sizeBytes} bytes)</span>
              </li>
            ))}
          </ul>
        )}
        <AttachmentUploadForm taskId={task.id} />
      </section>
    </>
  );
}
