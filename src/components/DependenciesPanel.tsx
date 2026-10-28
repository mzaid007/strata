"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { addTaskDependency, removeTaskDependency } from "@/app/actions/collab";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type DepTask = { id: string; title: string; completedAt: string | null };

export function DependenciesPanel({
  taskId,
  blockedBy,
  blocking,
  candidateTasks,
}: {
  taskId: string;
  blockedBy: { dependencyId: string; task: DepTask }[];
  blocking: { dependencyId: string; task: DepTask }[];
  candidateTasks: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(addTaskDependency, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) formRef.current?.reset();
  }, [state]);

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Dependencies</h2>
      <div style={{ marginBottom: "0.75rem" }}>
        <strong style={{ fontSize: "0.9rem" }}>Blocked by</strong>
        {blockedBy.length === 0 ? (
          <p className="muted">Nothing blocking this task.</p>
        ) : (
          <ul className="subtask-list">
            {blockedBy.map((d) => (
              <li key={d.dependencyId} className="row" style={{ justifyContent: "space-between" }}>
                <Link
                  href={`/tasks/${d.task.id}`}
                  style={{ textDecoration: d.task.completedAt ? "line-through" : "none" }}
                >
                  {d.task.title}
                  {!d.task.completedAt ? <span className="badge" style={{ marginLeft: 6 }}>open</span> : null}
                </Link>
                <form action={removeTaskDependency.bind(null, d.dependencyId)}>
                  <button className="btn btn-ghost" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <strong style={{ fontSize: "0.9rem" }}>Blocking</strong>
        {blocking.length === 0 ? (
          <p className="muted">Not blocking other tasks.</p>
        ) : (
          <ul className="subtask-list">
            {blocking.map((d) => (
              <li key={d.dependencyId} className="row" style={{ justifyContent: "space-between" }}>
                <Link href={`/tasks/${d.task.id}`}>{d.task.title}</Link>
                <form action={removeTaskDependency.bind(null, d.dependencyId)}>
                  <button className="btn btn-ghost" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
      {candidateTasks.length > 0 ? (
        <form ref={formRef} action={action}>
          <FormBanner state={state} />
          <input type="hidden" name="taskId" value={taskId} />
          <div className="field">
            <label htmlFor="relation">Relation</label>
            <select id="relation" name="relation" defaultValue="blocked_by">
              <option value="blocked_by">Blocked by…</option>
              <option value="blocking">Blocking…</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="otherTaskId">Task</label>
            <select id="otherTaskId" name="otherTaskId" required defaultValue="">
              <option value="" disabled>
                Choose task…
              </option>
              {candidateTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add dependency"}
          </button>
        </form>
      ) : (
        <p className="muted">No other tasks available to link.</p>
      )}
    </section>
  );
}
