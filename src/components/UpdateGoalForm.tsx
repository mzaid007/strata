"use client";

import { useActionState } from "react";
import { updateGoal } from "@/app/actions/goals";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function UpdateGoalForm({
  goalId,
  status,
  progress,
}: {
  goalId: string;
  status: string;
  progress: number;
}) {
  const [state, action, pending] = useActionState(updateGoal, initialActionState);
  return (
    <form action={action} className="row" style={{ gap: "0.5rem", marginTop: "0.65rem" }}>
      <input type="hidden" name="goalId" value={goalId} />
      <FormBanner state={state} />
      <select name="status" defaultValue={status} aria-label="Status">
        <option value="ON_TRACK">On track</option>
        <option value="AT_RISK">At risk</option>
        <option value="OFF_TRACK">Off track</option>
        <option value="COMPLETE">Complete</option>
      </select>
      <input
        name="progress"
        type="number"
        min={0}
        max={100}
        defaultValue={progress}
        aria-label="Progress"
        style={{ width: 72 }}
      />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "…" : "Update"}
      </button>
    </form>
  );
}
