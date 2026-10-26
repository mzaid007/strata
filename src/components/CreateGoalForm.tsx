"use client";

import { useActionState } from "react";
import { createGoal } from "@/app/actions/goals";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreateGoalForm() {
  const [state, action, pending] = useActionState(createGoal, initialActionState);
  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="title">Goal</label>
        <input id="title" name="title" required placeholder="Ship Q4 launch readiness" />
        {state.fieldErrors?.title ? <p className="field-error">{state.fieldErrors.title}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="description">Notes</label>
        <textarea id="description" name="description" rows={2} />
      </div>
      <div className="field">
        <label htmlFor="targetDate">Target date</label>
        <input id="targetDate" name="targetDate" type="date" />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create goal"}
      </button>
    </form>
  );
}
