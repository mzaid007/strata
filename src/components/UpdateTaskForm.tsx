"use client";

import { useActionState } from "react";
import { updateTask } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type MemberOption = { id: string; name: string };

export function UpdateTaskForm({
  taskId,
  title,
  description,
  assigneeId,
  startOn,
  dueOn,
  members,
}: {
  taskId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  startOn: string | null;
  dueOn: string | null;
  members: MemberOption[];
}) {
  const [state, action, pending] = useActionState(updateTask, initialActionState);

  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Edit task</h2>
      <FormBanner state={state} />
      <input type="hidden" name="taskId" value={taskId} />
      <div className="field">
        <label htmlFor="edit-title">Title</label>
        <input id="edit-title" name="title" required defaultValue={title} />
      </div>
      <div className="field">
        <label htmlFor="edit-description">Description</label>
        <textarea id="edit-description" name="description" rows={4} defaultValue={description} />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="edit-assignee">Assignee</label>
          <select
            id="edit-assignee"
            name="assigneeId"
            defaultValue={assigneeId ?? ""}
            style={{ padding: "0.65rem", borderRadius: 10, border: "1px solid var(--line)", width: "100%" }}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: 140 }}>
          <label htmlFor="edit-start">Start</label>
          <input id="edit-start" name="startOn" type="date" defaultValue={startOn ?? ""} />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: 140 }}>
          <label htmlFor="edit-due">Due</label>
          <input id="edit-due" name="dueOn" type="date" defaultValue={dueOn ?? ""} />
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
