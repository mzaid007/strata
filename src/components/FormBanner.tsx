import type { ActionState } from "@/lib/action-result";

export function FormBanner({ state }: { state: ActionState }) {
  if (state.ok) {
    if (!state.message) return null;
    return <p className="form-success">{state.message}</p>;
  }
  return <div className="error">{state.error}</div>;
}
