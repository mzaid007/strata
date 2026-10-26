import { redirect } from "next/navigation";
import { getSession, getPrimaryMembership } from "@/lib/session";
import { CreateWorkspaceForm } from "@/components/CreateWorkspaceForm";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const membership = await getPrimaryMembership(session.user.id);
  if (membership) redirect("/home");

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="page-title" style={{ fontSize: "1.9rem" }}>
          Create a workspace
        </h1>
        <p className="page-sub">
          Strata organizes work in a workspace — projects, sections, and multi-home tasks live here.
        </p>
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
