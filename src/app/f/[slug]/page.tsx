import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SubmitFormForm } from "@/components/SubmitFormForm";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(`/f/${slug}`)}`);
  }

  const form = await prisma.projectForm.findFirst({
    where: { slug, isOpen: true },
    include: {
      fields: { orderBy: { position: "asc" } },
      project: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });
  if (!form) notFound();

  const membership = await prisma.orgMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: form.organizationId,
        userId: session.user.id,
      },
    },
  });
  if (!membership) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1 className="page-title">No access</h1>
          <p className="page-sub">
            You need to be a member of {form.organization.name} to submit this form.
          </p>
          <Link className="btn" href="/home">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ width: "min(560px, 100%)" }}>
        <p className="brand" style={{ marginBottom: "0.5rem" }}>
          Strata<span>.</span>
        </p>
        <h1 className="page-title">{form.title}</h1>
        <p className="page-sub">
          {form.description || `Creates a task in ${form.project.name}.`}
        </p>
        <SubmitFormForm
          formId={form.id}
          fields={form.fields.map((f) => ({
            id: f.id,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required,
            options: f.options,
          }))}
        />
      </div>
    </div>
  );
}
