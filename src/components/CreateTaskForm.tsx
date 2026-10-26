"use client";

import { useActionState } from "react";
import { createTask } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type SectionOption = { id: string; name: string };

export function CreateTaskForm({
  projectId,
  sections,
}: {
  projectId: string;
  sections: SectionOption[];
}) {
  const [state, action, pending] = useActionState(createTask, initialActionState);
  if (sections.length === 0) return null;

  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <FormBanner state={state} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="task-title">New task</label>
          <input
            id="task-title"
            name="title"
            required
            placeholder="What needs doing?"
            style={{ borderRadius: 999, border: "1px solid var(--line)", padding: "0.7rem 1rem" }}
          />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: 140 }}>
          <label htmlFor="task-section">Section</label>
          <select
            id="task-section"
            name="sectionId"
            required
            defaultValue={sections[0].id}
            style={{ padding: "0.65rem", borderRadius: 10, border: "1px solid var(--line)" }}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
