"use client";

import { useActionState } from "react";
import { inviteMember } from "@/app/actions/workspace";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMember, initialActionState);

  return (
    <form action={action}>
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="user@example.com"
          aria-invalid={state.ok === false && !!state.fieldErrors?.email}
        />
        {state.ok === false && state.fieldErrors?.email ? (
          <p className="field-error">{state.fieldErrors.email}</p>
        ) : null}
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to workspace"}
      </button>
    </form>
  );
}
