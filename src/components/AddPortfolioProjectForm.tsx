"use client";

import { useActionState } from "react";
import { addProjectToPortfolio } from "@/app/actions/portfolios";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function AddPortfolioProjectForm({
  portfolioId,
  projects,
}: {
  portfolioId: string;
  projects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addProjectToPortfolio, initialActionState);
  if (projects.length === 0) {
    return <p className="muted">No more projects to add.</p>;
  }
  return (
    <form action={action}>
      <input type="hidden" name="portfolioId" value={portfolioId} />
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="projectId">Add project</label>
        <select id="projectId" name="projectId" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
