"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function AddCommentForm({
  taskId,
  mentionHints = [],
}: {
  taskId: string;
  mentionHints?: string[];
}) {
  const [state, action, pending] = useActionState(addComment, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} style={{ marginTop: "1rem" }}>
      <FormBanner state={state} />
      <input type="hidden" name="taskId" value={taskId} />
      <div className="field">
        <label htmlFor="body">Add comment</label>
        <textarea
          id="body"
          name="body"
          rows={3}
          required
          placeholder={
            mentionHints.length
              ? `Write a note… try @${mentionHints[0]}`
              : "Write a note…"
          }
        />
        {mentionHints.length > 0 ? (
          <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
            Mentions: {mentionHints.slice(0, 6).map((n) => `@${n}`).join(", ")}
            {mentionHints.length > 6 ? "…" : ""}
          </p>
        ) : null}
        {state.ok === false && state.fieldErrors?.body ? (
          <p className="field-error">{state.fieldErrors.body}</p>
        ) : null}
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
