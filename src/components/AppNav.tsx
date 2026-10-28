"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { GlobalSearch } from "@/components/GlobalSearch";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

const links = [
  { href: "/home", label: "Home" },
  { href: "/my-tasks", label: "My Tasks" },
  { href: "/projects", label: "Projects" },
  { href: "/calendar", label: "Calendar" },
  { href: "/goals", label: "Goals" },
  { href: "/portfolios", label: "Portfolios" },
  { href: "/workload", label: "Workload" },
  { href: "/inbox", label: "Inbox", badgeKey: "inbox" as const },
  { href: "/admin", label: "Admin" },
];

export function AppNav({
  userName,
  workspaces,
  activeOrgId,
  inboxBadge,
}: {
  userName: string;
  workspaces: { id: string; name: string }[];
  activeOrgId: string;
  inboxBadge?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <p className="brand">
        Strata<span>.</span>
      </p>
      <WorkspaceSwitcher workspaces={workspaces} activeOrgId={activeOrgId} />
      <GlobalSearch />
      <nav className="nav">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            prefetch
            data-active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
          >
            <span>{l.label}</span>
            {l.badgeKey === "inbox" ? inboxBadge : null}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
        <p className="muted" style={{ marginBottom: "0.6rem" }}>
          {userName}
        </p>
        <button type="button" className="btn btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
