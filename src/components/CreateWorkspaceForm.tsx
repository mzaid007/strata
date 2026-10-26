"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialActionState);

  return (
    <form action={action}>
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="name">Workspace name</label>
        <input id="name" name="name" required placeholder="Acme Product" />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Continue"}
      </button>
    </form>
  );
}
