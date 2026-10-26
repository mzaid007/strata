"use client";

import { useActionState } from "react";
import { addTaskToProject } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type Placement = { value: string; label: string };

export function MultiHomeForm({
  taskId,
  placements,
}: {
  taskId: string;
  placements: Placement[];
}) {
  const [state, action, pending] = useActionState(addTaskToProject, initialActionState);

  if (placements.length === 0) {
    return <p className="muted">No project sections available.</p>;
  }

  return (
    <form action={action} className="row" style={{ marginTop: "0.75rem", alignItems: "flex-end" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <FormBanner state={state} />
        <label className="muted" htmlFor="placement" style={{ display: "block", marginBottom: 4 }}>
          Project · section
        </label>
        <select
          id="placement"
          name="placement"
          required
          style={{ width: "100%", padding: "0.55rem", borderRadius: 10, border: "1px solid var(--line)" }}
        >
          <option value="">Add to project…</option>
          {placements.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Multi-home"}
      </button>
    </form>
  );
}
