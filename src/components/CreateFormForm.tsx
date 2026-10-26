"use client";

import { useActionState } from "react";
import { createProjectForm } from "@/app/actions/forms";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreateFormForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(createProjectForm, initialActionState);
  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <input type="hidden" name="projectId" value={projectId} />
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="title">Form title</label>
        <input id="title" name="title" required placeholder="Intake request" />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2} />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create form"}
      </button>
    </form>
  );
}
