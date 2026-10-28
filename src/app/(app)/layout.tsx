import { Suspense } from "react";
import { requireOrgContext } from "@/lib/session";
import { AppNav } from "@/components/AppNav";
import { UnreadBadge } from "@/components/UnreadBadge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, org, memberships } = await requireOrgContext();

  return (
    <div className="app-shell">
      <AppNav
        userName={session.user.name}
        workspaces={memberships.map((m) => ({
          id: m.organizationId,
          name: m.organization.name,
        }))}
        activeOrgId={org.id}
        inboxBadge={
          <Suspense fallback={null}>
            <UnreadBadge />
          </Suspense>
        }
      />
      <main className="main">
        <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
      </main>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="page-loading" aria-busy="true" aria-live="polite">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );
}
