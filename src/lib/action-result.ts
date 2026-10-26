export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const actionOk = (message?: string): ActionState =>
  message ? { ok: true, message } : { ok: true };

export const actionFail = (
  error: string,
  fieldErrors?: Record<string, string>,
): ActionState => ({ ok: false, error, fieldErrors });

export const initialActionState: ActionState = { ok: true };
