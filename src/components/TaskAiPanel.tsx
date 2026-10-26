"use client";

import { useActionState } from "react";
import { runTaskAi } from "@/app/actions/ai";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function TaskAiPanel({ taskId, configured }: { taskId: string; configured: boolean }) {
  const [state, action, pending] = useActionState(runTaskAi, initialActionState);

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>AI assist</h2>
      {!configured ? (
        <p className="muted">
          Optional: set <code>GROQ_API_KEY</code>, <code>GOOGLE_GENERATIVE_AI_API_KEY</code>, or{" "}
          <code>OPENROUTER_API_KEY</code> in <code>.env</code>.
        </p>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Free-tier providers only — summarize, draft, or suggest subtasks.
          </p>
          {state.ok === false ? <FormBanner state={state} /> : null}
          {state.ok === true && state.message ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "color-mix(in srgb, white 70%, transparent)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "0.75rem",
                fontSize: "0.88rem",
              }}
            >
              {state.message}
            </pre>
          ) : null}
          <div className="row" style={{ marginTop: "0.5rem" }}>
            {(["summarize", "draft", "suggest"] as const).map((kind) => (
              <form key={kind} action={action}>
                <input type="hidden" name="taskId" value={taskId} />
                <input type="hidden" name="kind" value={kind} />
                <button className="btn btn-ghost" type="submit" disabled={pending}>
                  {pending ? "…" : kind === "summarize" ? "Summarize" : kind === "draft" ? "Draft" : "Suggest"}
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
