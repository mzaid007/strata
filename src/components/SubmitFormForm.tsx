"use client";

import { useActionState } from "react";
import { submitProjectForm } from "@/app/actions/forms";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

type Field = {
  id: string;
  label: string;
  fieldType: "TEXT" | "TEXTAREA" | "EMAIL" | "SELECT";
  required: boolean;
  options: string;
};

export function SubmitFormForm({ formId, fields }: { formId: string; fields: Field[] }) {
  const [state, action, pending] = useActionState(submitProjectForm, initialActionState);
  return (
    <form action={action} className="card">
      <input type="hidden" name="formId" value={formId} />
      <FormBanner state={state} />
      {fields.map((field) => {
        const name = `field_${field.id}`;
        const err = state.fieldErrors?.[name];
        return (
          <div className="field" key={field.id}>
            <label htmlFor={name}>
              {field.label}
              {field.required ? " *" : ""}
            </label>
            {field.fieldType === "TEXTAREA" ? (
              <textarea id={name} name={name} rows={4} required={field.required} />
            ) : field.fieldType === "SELECT" ? (
              <select id={name} name={name} required={field.required} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {field.options
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean)
                  .map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                id={name}
                name={name}
                type={field.fieldType === "EMAIL" ? "email" : "text"}
                required={field.required}
              />
            )}
            {err ? <p className="field-error">{err}</p> : null}
          </div>
        );
      })}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
