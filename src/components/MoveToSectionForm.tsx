"use client";

import { useActionState } from "react";
import { moveTaskToSection } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type SectionOption = { id: string; name: string };

export function MoveToSectionForm({
  taskId,
  projectId,
  currentSectionId,
  sections,
  compact = false,
}: {
  taskId: string;
  projectId: string;
  currentSectionId: string;
  sections: SectionOption[];
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(moveTaskToSection, initialActionState);
  const others = sections.filter((s) => s.id !== currentSectionId);
  if (others.length === 0) return null;

  return (
    <form
      action={action}
      onClick={(e) => e.stopPropagation()}
      className={compact ? "move-form move-form-compact" : "move-form"}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="projectId" value={projectId} />
      {!compact ? <FormBanner state={state} /> : null}
      <label className="muted" htmlFor={`move-${taskId}`} style={{ display: "block", marginBottom: 4 }}>
        Move to section
      </label>
      <div className="row" style={{ gap: "0.4rem" }}>
        <select
          id={`move-${taskId}`}
          name="sectionId"
          required
          defaultValue=""
          style={{
            flex: 1,
            padding: compact ? "0.35rem 0.45rem" : "0.55rem",
            borderRadius: 10,
            border: "1px solid var(--line)",
            fontSize: compact ? "0.8rem" : undefined,
          }}
        >
          <option value="" disabled>
            Choose…
          </option>
          {others.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" type="submit" disabled={pending} style={{ padding: compact ? "0.35rem 0.7rem" : undefined }}>
          {pending ? "…" : "Move"}
        </button>
      </div>
      {compact && state.ok === false ? (
        <p className="field-error" style={{ marginTop: 4 }}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
