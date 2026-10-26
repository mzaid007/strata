import { redirect } from "next/navigation";
import { getSession, getPrimaryMembership } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const membership = await getPrimaryMembership(session.user.id);
  redirect(membership ? "/home" : "/onboarding");
}
