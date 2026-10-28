"use client";

import { useActionState } from "react";
import { createAutomationRule } from "@/app/actions/rules";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreateRuleForm({
  projectId,
  sections,
  members,
}: {
  projectId: string;
  sections: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAutomationRule, initialActionState);
  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <input type="hidden" name="projectId" value={projectId} />
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="name">Rule name</label>
        <input id="name" name="name" required placeholder="When done → Review" />
      </div>
      <div className="field">
        <label htmlFor="trigger">When</label>
        <select id="trigger" name="trigger" defaultValue="TASK_COMPLETED">
          <option value="TASK_COMPLETED">Task completed</option>
          <option value="TASK_CREATED">Task created</option>
          <option value="TASK_ASSIGNED">Task assigned</option>
        </select>
      </div>
      <fieldset className="rule-conditions">
        <legend>Only if (optional)</legend>
        <div className="field">
          <label htmlFor="titleContains">Title contains</label>
          <input id="titleContains" name="titleContains" placeholder="e.g. bug" />
        </div>
        <div className="field">
          <label htmlFor="hasAssignee">Has assignee</label>
          <select id="hasAssignee" name="hasAssignee" defaultValue="">
            <option value="">Any</option>
            <option value="yes">Assigned</option>
            <option value="no">Unassigned</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="conditionAssigneeId">Assignee is</label>
          <select id="conditionAssigneeId" name="conditionAssigneeId" defaultValue="">
            <option value="">Any</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <label className="row" style={{ gap: "0.45rem" }}>
          <input type="checkbox" name="onlyIfIncomplete" />
          Only if task is still incomplete
        </label>
      </fieldset>
      <div className="field">
        <label htmlFor="action">Then</label>
        <select id="action" name="action" defaultValue="MOVE_TO_SECTION">
          <option value="MOVE_TO_SECTION">Move to section</option>
          <option value="ADD_COMMENT">Add comment</option>
          <option value="SET_ASSIGNEE">Set assignee</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="sectionId">Target section (for move)</label>
        <select id="sectionId" name="sectionId" defaultValue="">
          <option value="">—</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="commentBody">Comment body (for comment action)</label>
        <input id="commentBody" name="commentBody" placeholder="Auto note from rule" />
      </div>
      <div className="field">
        <label htmlFor="assigneeId">Assignee (for set assignee)</label>
        <select id="assigneeId" name="assigneeId" defaultValue="">
          <option value="">—</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create rule"}
      </button>
    </form>
  );
}
