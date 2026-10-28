"use client";

import { useActionState } from "react";
import { createOrgInvite } from "@/app/actions/invites";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(createOrgInvite, initialActionState);

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
      <p className="muted" style={{ marginTop: 0 }}>
        Registered users are added immediately. Others get a shareable invite link (14 days).
      </p>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invite"}
      </button>
    </form>
  );
}
