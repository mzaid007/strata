"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { createSubtask, toggleSubtaskComplete } from "@/app/actions/collab";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type Subtask = {
  id: string;
  title: string;
  completedAt: string | null;
};

export function SubtasksPanel({
  parentTaskId,
  subtasks,
}: {
  parentTaskId: string;
  subtasks: Subtask[];
}) {
  const [state, action, pending] = useActionState(createSubtask, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) formRef.current?.reset();
  }, [state]);

  const done = subtasks.filter((s) => s.completedAt).length;

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>
        Subtasks{" "}
        <span className="muted">
          ({done}/{subtasks.length})
        </span>
      </h2>
      {subtasks.length === 0 ? (
        <p className="muted">No subtasks yet.</p>
      ) : (
        <ul className="subtask-list">
          {subtasks.map((s) => (
            <li key={s.id} className="row" style={{ justifyContent: "space-between", gap: "0.5rem" }}>
              <Link
                href={`/tasks/${s.id}`}
                style={{ textDecoration: s.completedAt ? "line-through" : "none" }}
              >
                {s.title}
              </Link>
              <form action={toggleSubtaskComplete.bind(null, s.id)}>
                <button className="btn btn-ghost" type="submit">
                  {s.completedAt ? "Reopen" : "Complete"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} style={{ marginTop: "0.75rem" }}>
        <FormBanner state={state} />
        <input type="hidden" name="parentTaskId" value={parentTaskId} />
        <div className="field">
          <label htmlFor="subtask-title">Add subtask</label>
          <input id="subtask-title" name="title" required placeholder="Break work down…" />
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add subtask"}
        </button>
      </form>
    </section>
  );
}
