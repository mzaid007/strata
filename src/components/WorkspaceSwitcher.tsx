"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchWorkspace } from "@/app/actions/workspace";

export function WorkspaceSwitcher({
  workspaces,
  activeOrgId,
}: {
  workspaces: { id: string; name: string }[];
  activeOrgId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(activeOrgId);
  const [error, setError] = useState<string | null>(null);

  if (workspaces.length <= 1) {
    return (
      <p className="workspace-switcher-single" title={workspaces[0]?.name}>
        {workspaces[0]?.name ?? "Workspace"}
      </p>
    );
  }

  function onChange(organizationId: string) {
    setSelected(organizationId);
    setError(null);
    startTransition(async () => {
      const result = await switchWorkspace(organizationId);
      if (result.ok === false) {
        setError(result.error);
        setSelected(activeOrgId);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="workspace-switcher">
      <label className="sr-only" htmlFor="workspace-switcher">
        Current workspace
      </label>
      <select
        id="workspace-switcher"
        value={selected}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
