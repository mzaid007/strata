"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialActionState);

  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>New project</h2>
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="project-name">Name</label>
        <input id="project-name" name="name" required placeholder="Product Launch" />
      </div>
      <div className="field">
        <label htmlFor="project-description">Description (optional)</label>
        <textarea id="project-description" name="description" rows={2} />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
