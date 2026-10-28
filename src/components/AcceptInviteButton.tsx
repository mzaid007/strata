"use client";

import { useActionState } from "react";
import { acceptOrgInvite } from "@/app/actions/invites";
import { initialActionState, type ActionState } from "@/lib/action-result";

export function AcceptInviteButton({ token }: { token: string }) {
  async function action(_prev: ActionState): Promise<ActionState> {
    return acceptOrgInvite(token);
  }
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction}>
      {state.ok === false ? <div className="error">{state.error}</div> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Joining…" : "Accept invite"}
      </button>
    </form>
  );
}
