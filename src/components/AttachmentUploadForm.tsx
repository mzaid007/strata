"use client";

import { useActionState } from "react";
import { uploadAttachment } from "@/app/actions/attachments";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function AttachmentUploadForm({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(uploadAttachment, initialActionState);

  return (
    <form action={action} encType="multipart/form-data" style={{ marginTop: "0.75rem" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="file">Upload file</label>
        <input id="file" name="file" type="file" required />
        {state.fieldErrors?.file ? (
          <p className="field-error">{state.fieldErrors.file}</p>
        ) : null}
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
