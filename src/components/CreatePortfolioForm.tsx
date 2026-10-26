"use client";

import { useActionState } from "react";
import { createPortfolio } from "@/app/actions/portfolios";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function CreatePortfolioForm() {
  const [state, action, pending] = useActionState(createPortfolio, initialActionState);
  return (
    <form action={action} className="card" style={{ marginBottom: "1rem" }}>
      <FormBanner state={state} />
      <div className="field">
        <label htmlFor="name">Portfolio</label>
        <input id="name" name="name" required placeholder="Company initiatives" />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2} />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create portfolio"}
      </button>
    </form>
  );
}
